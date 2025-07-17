
// lucide-react.d.ts
declare module 'lucide-react' {
    import {SVGProps} from 'react';
  
    export interface LucideProps extends SVGProps<SVGSVGElement> {
      size?: string | number;
      absoluteStrokeWidth?: boolean;
    }

    export type Icon = React.FC<LucideProps>;
    export const Timer: Icon;
    export const Users: Icon;
    export const Trophy: Icon;
    export const MapPin: Icon;
    export const Play: Icon;
    export const Pause: Icon;
    export const RefreshCw: Icon;
    export const AlertTriangle: Icon;
    export const ShieldCheck: Icon;
    export const Download: Icon;
    export const ClipboardPlus: Icon;
    export const Star: Icon;
    export const Shield: Icon;
    export const Swords: Icon;
    export const Award: Icon;
    export const PlusSquare: Icon;
    export const UserMinus: Icon;
    export const Ban: Icon;
    export const Replace: Icon;
    export const Mic: Icon;
    export const Loader2: Icon;
    export const User: Icon;
    export const Clock: Icon;
    export const Hourglass: Icon;
}
