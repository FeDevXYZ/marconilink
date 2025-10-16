import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { CUSTOM_AVATAR_URLS } from "../utils/avatarUtils";

interface AvatarPickerProps {
  selected: number;
  onSelect: (index: number) => void;
}

export function AvatarPicker({ selected, onSelect }: AvatarPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm">Scegli un avatar</p>
      <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
        {CUSTOM_AVATAR_URLS.map((url, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`
              rounded-lg p-1 transition-all hover:scale-105
              ${selected === index 
                ? 'ring-2 ring-primary bg-primary/10' 
                : 'hover:bg-white/20'
              }
            `}
          >
            <Avatar className="w-full aspect-square">
              <AvatarImage src={url} />
              <AvatarFallback>{index + 1}</AvatarFallback>
            </Avatar>
          </button>
        ))}
      </div>
    </div>
  );
}
