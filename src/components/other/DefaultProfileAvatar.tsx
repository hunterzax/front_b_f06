type CustomerLogoProps = {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
};

export default function DefaultProfileAvatar({
  className,
  width,
  height,
  alt = "Profile Picture",
}: CustomerLogoProps) {
  const src = process.env.NEXT_PUBLIC_DEFAULT_PROFILE_AVATAR;

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
