import TextField from '@mui/material/TextField';

export const Field = ({ label, value, onChange, type = 'text', placeholder, hint, error, onBlur }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'search' | 'date' | 'number';
  placeholder?: string;
  hint?: string;
  /** Already-resolved copy. The region did the lookup. */
  error?: string;
  onBlur?: () => void;
}) => (
  <TextField
    label={label}
    value={value}
    type={type}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    error={Boolean(error)}
    helperText={error ?? hint}
    size="small"
    fullWidth
    slotProps={type === 'date' ? { inputLabel: { shrink: true } } : undefined}
  />
);
