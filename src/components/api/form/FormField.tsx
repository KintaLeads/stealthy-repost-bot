
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  error?: string;
  type?: string;
  description?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  icon,
  error,
  type = "text",
  description
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`transition-all focus:border-primary/30 ${icon ? 'pl-9' : ''}`}
          type={type}
        />
        {icon && (
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
};

export default FormField;
