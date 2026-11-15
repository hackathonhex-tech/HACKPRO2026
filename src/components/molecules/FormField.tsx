import React from 'react';
import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, className, ...props }) => {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
};
