import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { User, KeyRound, Plus, X } from "lucide-react";
import { AvatarPicker } from "./AvatarPicker";
import { getAvatarIndex } from "../utils/avatarUtils";
import { toast } from "sonner@2.0.3";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  adminCode: string;
  onProfileUpdate: () => void;
}

export function ProfileDialog({ open, onOpenChange, userId, adminCode, onProfileUpdate }: ProfileDialogProps) {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [codes, setCodes] = useState<string[]>([]);
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/user/profile/${userId}`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const profile = await response.json();
        setName(profile.name || '');
        setSurname(profile.surname || '');
        setAvatarIndex(profile.avatarIndex ?? 0);
        setCodes(profile.codes || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Errore nel caricamento del profilo');
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !surname.trim()) {
      toast.error('Nome e cognome sono obbligatori');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0e1ba11c/user/profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId,
            name: name.trim(),
            surname: surname.trim(),
            avatarIndex,
            codes,
          }),
        }
      );

      if (response.ok) {
        toast.success('Profilo aggiornato con successo!');
        onProfileUpdate();
        onOpenChange(false);
      } else {
        toast.error('Errore nel salvataggio del profilo');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Errore nel salvataggio del profilo');
    } finally {
      setLoading(false);
    }
  };

  const addCode = () => {
    const code = newCode.trim().toUpperCase();
    if (code && !codes.includes(code)) {
      setCodes([...codes, code]);
      setNewCode('');
    }
  };

  const removeCode = (codeToRemove: string) => {
    setCodes(codes.filter(c => c !== codeToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-white/90 border-white/40 shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Il tuo profilo
          </DialogTitle>
          <DialogDescription>
            Inserisci i tuoi dati e i codici di accesso alle categorie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Mario"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/60 border-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surname">Cognome *</Label>
            <Input
              id="surname"
              placeholder="Rossi"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="bg-white/60 border-white/40"
            />
          </div>

          <AvatarPicker
            selected={avatarIndex}
            onSelect={setAvatarIndex}
          />

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Codici di accesso (facoltativo)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Inserisci codice..."
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && addCode()}
                className="bg-white/60 border-white/40"
              />
              <Button onClick={addCode} size="icon" className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {codes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {codes.map((code) => (
                  <Badge
                    key={code}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {code}
                    <button onClick={() => removeCode(code)} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              I codici determinano a quali categorie di post hai accesso e le tue permessi.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
