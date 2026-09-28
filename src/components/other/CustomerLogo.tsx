type CustomerLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
};

export default function CustomerLogo({
  className,
  width,
  height,
  alt = "PTT",
}: CustomerLogoProps) {
  const src = process.env.NEXT_PUBLIC_CUSTOMER_LOGO_URL;

  if (!src) return null;

  return (
    <img
      className={className}
      src={src}
      width={width}
      height={height}
      alt={alt}
    />
  );
}
