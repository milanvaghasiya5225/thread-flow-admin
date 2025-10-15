import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳' },
  { code: 'CA', dialCode: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', dialCode: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', dialCode: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', dialCode: '+33', name: 'France', flag: '🇫🇷' },
  { code: 'AE', dialCode: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'PK', dialCode: '+92', name: 'Pakistan', flag: '🇵🇰' },
];

interface SmartContactInputProps {
  value: string;
  onChange: (value: string, isPhone: boolean) => void;
  disabled?: boolean;
  error?: string;
  phoneOnly?: boolean;
}

export const SmartContactInput = ({ 
  value, 
  onChange, 
  disabled,
  error,
  phoneOnly = false
}: SmartContactInputProps) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [inputValue, setInputValue] = useState('');
  const [isPhone, setIsPhone] = useState(phoneOnly);

  useEffect(() => {
    // Auto-detect if input is email or phone
    const trimmedValue = inputValue.trim();
    const containsAt = trimmedValue.includes('@');
    const isNumeric = /^\d+$/.test(trimmedValue.replace(/\s/g, ''));
    
    const shouldBePhone = phoneOnly || (!containsAt && isNumeric && trimmedValue.length > 0);
    setIsPhone(shouldBePhone);

    // Construct the full value
    let fullValue = trimmedValue;
    if (shouldBePhone && trimmedValue) {
      fullValue = `${selectedCountry.dialCode}${trimmedValue}`;
    }

    onChange(fullValue, shouldBePhone);
  }, [inputValue, selectedCountry, onChange, phoneOnly]);

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRY_CODES.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="contact">{phoneOnly ? 'Phone Number' : 'Email or Phone Number'}</Label>
      <div className="flex gap-2">
        {isPhone && (
          <Select
            value={selectedCountry.code}
            onValueChange={handleCountryChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm">{selectedCountry.dialCode}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {COUNTRY_CODES.map((country) => (
                <SelectItem 
                  key={country.code} 
                  value={country.code}
                  className="cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium">{country.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {country.dialCode}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex-1">
          <Input
            id="contact"
            type="text"
            placeholder={isPhone ? "1234567890" : "name@example.com"}
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            className={error ? "border-destructive" : ""}
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        {isPhone 
          ? `We'll send a verification code to ${selectedCountry.dialCode}${inputValue}`
          : phoneOnly ? "Enter your phone number" : "Enter your email or start typing numbers for phone"}
      </p>
    </div>
  );
};
