interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <p
      className={`text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg ${className ?? ""}`}
    >
      {message}
    </p>
  );
}
