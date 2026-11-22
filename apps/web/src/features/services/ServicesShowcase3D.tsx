import { Lightbulb, MessageCircle, Sparkles, Target } from "lucide-react";
import styles from "./services-showcase.module.css";

const SERVICE_TILES = [
  { number: "01", icon: Target, className: styles.tileOne },
  { number: "02", icon: Lightbulb, className: styles.tileTwo },
  { number: "03", icon: MessageCircle, className: styles.tileThree },
] as const;

/** Pure-CSS 3D illustration for the services hero — no images, canvas or extra libraries. */
export function ServicesShowcase3D() {
  return (
    <div
      className={styles.scene}
      role="img"
      aria-label="باقة خدمات تعليمية: استشارات مخصصة وجلسات تطويرية ومتابعة مباشرة"
    >
      <span className={styles.aura} aria-hidden="true" />
      <span className={styles.floor} aria-hidden="true" />

      <div className={styles.core} aria-hidden="true">
        <span className={`${styles.coreFace} ${styles.coreFront}`}>
          <Sparkles className={styles.coreIcon} strokeWidth={1.8} />
        </span>
        <span className={`${styles.coreFace} ${styles.coreRight}`} />
        <span className={`${styles.coreFace} ${styles.coreTop}`} />
      </div>

      {SERVICE_TILES.map(({ number, icon: Icon, className }) => (
        <div key={number} className={`${styles.tile} ${className}`} aria-hidden="true">
          <span className={styles.tileIcon}>
            <Icon width={18} height={18} strokeWidth={2} />
          </span>
          <span className={styles.tileNumber}>{number}</span>
        </div>
      ))}

      <span className={`${styles.spark} ${styles.sparkA}`} aria-hidden="true" />
      <span className={`${styles.spark} ${styles.sparkB}`} aria-hidden="true" />
      <span className={`${styles.spark} ${styles.sparkC}`} aria-hidden="true" />
      <span className={`${styles.spark} ${styles.sparkD}`} aria-hidden="true" />

      <span className={styles.counter} aria-hidden="true">
        03 خدمات
      </span>
    </div>
  );
}
