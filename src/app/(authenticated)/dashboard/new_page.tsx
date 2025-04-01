import type { Metadata } from "next"

import { DashboardShell } from "@/components/dashboard-shell"
import { MainCarousel } from "@/components/dashboard/main-carousel"
import { BirthdaysCarousel } from "@/components/dashboard/birthdays-carousel"

export const metadata: Metadata = {
  title: "Dashboard | elo",
  description: "Dashboard principal da elo",
}

export default async function DashboardPage() {


  return (
    <DashboardShell>
      <div className="grid grid-cols-1 md:grid-cols-3">
        <MainCarousel className="col-span-1 md:col-span-2" itens={[
          {
            imageRef: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fc8.alamy.com%2Fcomp%2F2CA8TE1%2Fdesign-label-2CA8TE1.jpg&f=1&nofb=1&ipt=fc122be5b7acb593ce1a4c07149a912616e8d4af5515952924c6bd5de6c43726&ipo=images',
            title: 'something'
          },
          {
            imageRef: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fc8.alamy.com%2Fcomp%2F2HD6CE3%2Fpresentation-templates-elements-template-design-for-print-banner-web-set-of-cover-header-brochure-2HD6CE3.jpg&f=1&nofb=1&ipt=e7f318f74d93debaa155704c1843c44f031c7fb48cc00f4c60f249b192caa80b&ipo=images',
            title: '2'
          },
        ]}/>
        <BirthdaysCarousel className="col-span-1 md:col-span-1" itens={[
          {
            imageRef: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fc8.alamy.com%2Fcomp%2F2CA8TE1%2Fdesign-label-2CA8TE1.jpg&f=1&nofb=1&ipt=fc122be5b7acb593ce1a4c07149a912616e8d4af5515952924c6bd5de6c43726&ipo=images',
            title: 'something'
          },
          {
            imageRef: 'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fc8.alamy.com%2Fcomp%2F2HD6CE3%2Fpresentation-templates-elements-template-design-for-print-banner-web-set-of-cover-header-brochure-2HD6CE3.jpg&f=1&nofb=1&ipt=e7f318f74d93debaa155704c1843c44f031c7fb48cc00f4c60f249b192caa80b&ipo=images',
            title: '2'
          },
        ]}/>
      </div>
    </DashboardShell>
  )
}