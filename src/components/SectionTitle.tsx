interface SectionTitleProps {
  title: string;
}

const SectionTitle = ({ title }: SectionTitleProps) => {
  return (
    <h2 className="text-foreground font-bold text-sm px-4 py-2">{title}</h2>
  );
};

export default SectionTitle;
