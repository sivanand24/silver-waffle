import {
  FileText,
  Flame,
  Home,
  IdCard,
  Landmark,
  PenLine,
  UserRound,
  UsersRound,
} from "lucide-react";

const ICONS = {
  person: UserRound,
  flame: Flame,
  home: Home,
  file: FileText,
  id: IdCard,
  users: UsersRound,
  bank: Landmark,
  pen: PenLine,
};

/** Renders a scheme/question/document icon by its data-file name. */
export default function ItemIcon({ name, ...props }) {
  const Icon = ICONS[name] || FileText;
  return <Icon {...props} />;
}
