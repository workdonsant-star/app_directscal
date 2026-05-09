import Image from "next/image";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="cursor-default hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent active:text-sidebar-foreground"
          aria-label="Directscal"
        >
          <Image
            src="/favicon.svg.svg"
            alt=""
            width={16}
            height={16}
            className="hidden h-4 w-auto shrink-0 object-contain group-data-[collapsible=icon]:block"
            aria-hidden="true"
          />
          <Image
            src="/directscal-logo.svg"
            alt="Directscal"
            width={142}
            height={16}
            priority
            className="h-4 w-auto object-contain dark:hidden group-data-[collapsible=icon]:hidden"
          />
          <Image
            src="/directscal-logo-dark.svg"
            alt="Directscal"
            width={142}
            height={16}
            priority
            className="hidden h-4 w-auto object-contain dark:block group-data-[collapsible=icon]:hidden"
          />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
