"use client";
import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";

export function MultipleSelector({
  options = [],
  value = [],
  onChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (val) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const handleRemove = (val) => {
    onChange(value.filter((v) => v !== val));
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full min-w-[180px] justify-between flex flex-wrap gap-1 text-left border-zinc-700 bg-zinc-800 text-white",
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1">
            {value.length === 0 ? (
              <span className="text-zinc-400">{placeholder}</span>
            ) : (
              options
                .filter((opt) => value.includes(opt.value))
                .map((opt) => (
                  <span
                    key={opt.value}
                    className="flex items-center bg-zinc-700 rounded px-2 py-0.5 text-xs mr-1 mb-1"
                  >
                    {opt.label}
                    <X
                      className="ml-1 w-3 h-3 cursor-pointer hover:text-red-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(opt.value);
                      }}
                    />
                  </span>
                ))
            )}
          </div>
          <div className="flex items-center gap-1">
            {value.length > 0 && (
              <X
                className="w-4 h-4 text-zinc-400 hover:text-red-400 mr-1"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="w-4 h-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 bg-zinc-900 border-zinc-700">
        <Command>
          <CommandInput placeholder="Search..." className="h-9" />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => handleSelect(opt.value)}
                  className="flex items-center"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(opt.value) ? "opacity-100 text-green-400" : "opacity-0"
                    )}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 