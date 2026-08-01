<?php

namespace App\Services\Wallet;

use App\Models\RechargeCode;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WalletService
{
    /**
     * Get or lazily create a wallet for the given student membership.
     */
    public function getOrCreateWallet(Tenant $tenant, TenantUser $student): Wallet
    {
        return Wallet::query()
            ->firstOrCreate(
                ['tenant_id' => $tenant->id, 'tenant_user_id' => $student->id],
                ['tenant_id' => $tenant->id, 'tenant_user_id' => $student->id, 'balance' => 0, 'currency' => 'EGP'],
            );
    }

    /**
     * Redeem a recharge code and credit the student's wallet.
     *
     * @return array{wallet: Wallet, transaction: WalletTransaction, amount: float|string, balance: float|string}
     */
    public function recharge(Tenant $tenant, TenantUser $student, string $code): array
    {
        $normalized = $this->normalizeCode($code);

        $rechargeCode = RechargeCode::query()
            ->where('tenant_id', $tenant->id)
            ->where('code', $normalized)
            ->first();

        if (! $rechargeCode) {
            throw ValidationException::withMessages([
                'code' => ['كود الشحن غير صالح.'],
            ]);
        }

        if (! $rechargeCode->is_active) {
            throw ValidationException::withMessages([
                'code' => ['كود الشحن غير مفعّل.'],
            ]);
        }

        if ($rechargeCode->isExpired()) {
            throw ValidationException::withMessages([
                'code' => ['انتهت صلاحية كود الشحن.'],
            ]);
        }

        if ($rechargeCode->isExhausted()) {
            throw ValidationException::withMessages([
                'code' => ['تم استخدام كود الشحن بالكامل.'],
            ]);
        }

        $wallet = $this->getOrCreateWallet($tenant, $student);
        $amount = (float) $rechargeCode->amount;

        // Lock the rows to guarantee atomicity under concurrent requests.
        [$wallet, $transaction] = DB::transaction(function () use ($tenant, $student, $wallet, $rechargeCode, $amount): array {
            $wallet = Wallet::query()
                ->where('id', $wallet->id)
                ->lockForUpdate()
                ->first();

            $rechargeCode = RechargeCode::query()
                ->where('id', $rechargeCode->id)
                ->lockForUpdate()
                ->first();

            if ($rechargeCode->used_count >= $rechargeCode->max_uses) {
                throw ValidationException::withMessages([
                    'code' => ['تم استخدام كود الشحن بالكامل.'],
                ]);
            }

            $newBalance = bcadd((string) $wallet->balance, (string) $amount, 2);

            $wallet->update(['balance' => $newBalance]);

            $transaction = WalletTransaction::create([
                'tenant_id' => $tenant->id,
                'wallet_id' => $wallet->id,
                'tenant_user_id' => $student->id,
                'recharge_code_id' => $rechargeCode->id,
                'type' => 'credit',
                'amount' => $amount,
                'balance_after' => $newBalance,
                'description' => 'شحن المحفظة بكود شحن',
            ]);

            $rechargeCode->increment('used_count');

            return [$wallet->refresh(), $transaction];
        });

        return [
            'wallet' => $wallet,
            'transaction' => $transaction,
            'amount' => $amount,
            'balance' => $wallet->balance,
        ];
    }

    /**
     * Generate a new recharge code (random or custom).
     */
    public function generate(Tenant $tenant, TenantUser $creator, array $data): RechargeCode
    {
        $amount = (float) $data['amount'];
        $maxUses = max(1, (int) ($data['max_uses'] ?? 1));
        $expiresAt = isset($data['expires_at']) && $data['expires_at']
            ? Carbon::parse($data['expires_at'])
            : null;

        $customCode = isset($data['code']) ? $this->normalizeCode((string) $data['code']) : null;

        $code = $customCode;
        if (! $code) {
            $code = $this->normalizeCode($this->randomCode());
            $tries = 0;
            while ($this->exists($tenant, $code) && $tries < 20) {
                $code = $this->normalizeCode($this->randomCode());
                $tries++;
            }
        }

        if ($this->exists($tenant, $code)) {
            throw ValidationException::withMessages([
                'code' => ['كود الشحن مستخدم من قبل.'],
            ]);
        }

        return RechargeCode::create([
            'tenant_id' => $tenant->id,
            'created_by_tenant_user_id' => $creator->id,
            'code' => $code,
            'amount' => $amount,
            'max_uses' => $maxUses,
            'used_count' => 0,
            'expires_at' => $expiresAt,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    public function randomCode(int $length = 10): string
    {
        // Human-friendly unambiguous alphabet (no 0/O/1/I/L).
        $alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
        $code = '';
        for ($i = 0; $i < $length; $i++) {
            $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }

        // Add a dash for readability: XXXXX-XXXXX
        return substr($code, 0, 5) . '-' . substr($code, 5);
    }

    public function normalizeCode(string $code): string
    {
        return strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $code) ?? '');
    }

    public function exists(Tenant $tenant, string $code): bool
    {
        return RechargeCode::query()
            ->where('tenant_id', $tenant->id)
            ->where('code', $this->normalizeCode($code))
            ->withTrashed()
            ->exists();
    }

    public static function isValidCodeFormat(string $code): bool
    {
        return (bool) preg_match('/^[A-Za-z0-9]{6,32}$/', $code);
    }
}
