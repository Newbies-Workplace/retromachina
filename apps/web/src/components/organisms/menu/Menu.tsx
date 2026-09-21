import {
  BugIcon,
  ClapperboardIcon,
  Disc3Icon,
  HandshakeIcon,
  InfoIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { UserAvatar } from "@/components/molecules/user_avatar/UserAvatar";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/context/user/UserContext.hook";
import { useChangelogStore } from "@/store/useChangelogStore";
import { APP_VERSION } from "@/utils/version";

interface MenuProps {
  onOpenPreferences: () => void;
}

const menuItemClassName =
  "h-9 cursor-pointer gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors [&_svg]:text-current";

export const Menu = ({ onOpenPreferences }: MenuProps) => {
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const onLogoutClick = async () => {
    await logout();

    navigate("/signin");
  };

  return (
    <DropdownMenuContent
      align="end"
      sideOffset={8}
      className="w-72 origin-(--radix-dropdown-menu-content-transform-origin) rounded-2xl border-border/70 bg-popover p-2 shadow-xl transition-[opacity,transform] duration-150 data-[state=closed]:duration-100"
    >
      <DropdownMenuLabel className="rounded-xl bg-muted/50 px-3 py-3 font-normal">
        <div className="flex items-center gap-3">
          <UserAvatar
            size="lg"
            avatarUrl={user?.avatar_link}
            name={user?.nick}
          />

          <div className="flex min-w-0 flex-col gap-0.5 text-left">
            <span className="truncate font-semibold text-foreground">
              {user?.nick}
            </span>
            <span
              className="truncate text-xs text-muted-foreground"
              title={user?.email}
            >
              {user?.email}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {user?.teams?.slice(0, 5).map((team) => (
            <span
              key={team.id}
              className="max-w-full truncate rounded-full bg-background px-1.5 text-sm"
            >
              {team.name}
            </span>
          ))}
        </div>
      </DropdownMenuLabel>

      <DropdownMenuSeparator className="mx-1 my-2" />

      <DropdownMenuGroup className="space-y-0.5">
        <DropdownMenuItem
          className={menuItemClassName}
          onClick={useChangelogStore.getState().showHistory}
        >
          <ClapperboardIcon className="text-current" />
          Co nowego
        </DropdownMenuItem>
        <DropdownMenuItem
          className={menuItemClassName}
          onSelect={onOpenPreferences}
        >
          <SettingsIcon className="text-current" />
          Ustawienia
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator className="mx-1 my-2" />

      <DropdownMenuGroup className="space-y-0.5">
        <DropdownMenuItem className={menuItemClassName} asChild>
          <Link to="/team/create">
            <HandshakeIcon className="text-current" />
            Stwórz Zespół
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className={menuItemClassName} asChild>
          <Link to="/gramophone">
            <Disc3Icon className="text-current" />
            Gramofon
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className={menuItemClassName} asChild>
          <Link to="/hero">
            <InfoIcon className="text-current" />O aplikacji
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem className={menuItemClassName} asChild>
          <Link to="mailto:newbies@rst.com.pl?subject=Bug retromachine&body=Opis błędu:">
            <BugIcon className="text-current" />
            Zgłoś błąd
          </Link>
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator className="mx-1 my-2" />

      <DropdownMenuItem
        className={menuItemClassName}
        variant="destructive"
        onSelect={onLogoutClick}
      >
        <LogOutIcon className="text-current" />
        Wyloguj
      </DropdownMenuItem>

      <p className="px-2 pb-0.5 pt-2.5 text-center text-[10px] font-medium tracking-wide text-muted-foreground">
        Wersja {APP_VERSION}
      </p>
    </DropdownMenuContent>
  );
};
