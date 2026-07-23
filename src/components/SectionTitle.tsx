interface SectionTitleProps {
  title: string;
  subtitle?: string;
}

const SectionTitle = ({ title, subtitle }: SectionTitleProps) => {
  return (
    <div className="px-4 pt-4 pb-2">
      <h2 className="text-foreground font-bold text-base tracking-tight">{title}</h2>
      {subtitle && (
        <p className="text-muted-foreground text-xs mt-0.5">{subtitle}</p>
      )}
    </div>
  );
};

export default SectionTitle;
