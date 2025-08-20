"use client";

import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { BackButton } from "./backButton";
import React from "react";

// Memoized CustomFieldTemplate to prevent unnecessary re-renders
export const CustomFieldTemplate = React.memo(function CustomFieldTemplate(props) {
  const {
    id,
    label,
    required,
    description,
    errors,
    help,
    children,
    disabled,
    schema,
    uiSchema, // Add this
  } = props;

  // Check if the field is hidden - check uiSchema properly
  if (uiSchema?.["ui:widget"] === "hidden") {
    return null;
  }

  return (
    <div className="mb-3 space-y-1">
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium ${disabled ? 'text-zinc-400 opacity-70' : 'text-white'}`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {description && <p className="text-xs text-zinc-400">{description}</p>}
      {children}
      {errors?.length > 0 && (
        <ul className="space-y-1 text-xs text-red-500">
          {errors.map((err, i) => (
            <li key={i}>• {err}</li>
          ))}
        </ul>
      )}
      {help}
    </div>
  );
});

export default function RJSFWrapper({ title, subtitle, icon, children, showBackButton = true }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-2 sm:px-4 py-4">
      <Card className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 shadow-lg">
        <CardHeader className="pb-2">
          {showBackButton && <BackButton />}
          <div className="flex items-center gap-2">
            {icon ?? <AlertCircle className="w-5 h-5 text-zinc-400" />}
            <CardTitle className="text-white text-xl font-semibold">
              {title}
            </CardTitle>
          </div>
          {subtitle && (
            <p className="text-sm text-zinc-400 pl-7 mt-1">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div
            className="
              space-y-4
              [&_input]:w-full
              [&_input]:rounded-md
              [&_input]:border
              [&_input]:border-zinc-700
              [&_input]:bg-zinc-950
              [&_input]:text-white
              [&_input]:px-3
              [&_input]:py-2
              [&_input:focus]:outline-none
              [&_input:focus]:ring-2
              [&_input:focus]:ring-white
              [&_input::placeholder]:text-zinc-400
              [&_input:disabled]:bg-zinc-800
              [&_input:disabled]:text-zinc-400
              [&_input:disabled]:cursor-not-allowed
              [&_input:disabled]:opacity-70
              [&_label]:text-sm
              [&_label]:font-medium
              [&_label]:text-white
            "
          >
            {children}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
