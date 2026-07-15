"use client";

import { MainCarousel } from "@/components/dashboard/main-carousel";
import { BirthdaysCarousel } from "@/components/dashboard/birthdays-carousel";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";
import {
  LinkIcon,
  LucideGraduationCap,
  Coffee,
  Sparkles,
  LucideMegaphone,
} from "lucide-react";
import { motion } from "framer-motion";
import { VideosCarousel } from "@/components/dashboard/videos-carousel";
import Link from "next/link";
import { NewsDisplay } from "@/components/dashboard/news-displ";
import { routeItems, type RouteItem } from "@/const/routes";
import { canViewHallEntrada } from "@/lib/access-control";
import { FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa6";
import Image from "next/image";
import { DashboardShell } from "@/components/ui/dashboard-shell";

import { SuggestionsWrapper } from "./suggestions-wrapper";
import { CompleteProfileModal } from "@/components/ui/complete-profile-modal";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { EmotionRulerWrapper } from "@/components/emotion-ruler/emotion-ruler-wrapper";
import { useState, useEffect, useMemo } from "react";

// Variantes de animação para o footer
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const transitionDefault = {
  duration: 0.5,
  ease: [0.4, 0, 0.2, 1] as const,
};

export default function DashboardPage() {
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Buscar dados usando client-side tRPC
  const { data: birthdays } = api.birthday.listCurrentMonth.useQuery();
  const { data: user, refetch: refetchUser } = api.user.me.useQuery();

  // Tipagem para os dados do usuário
  // Removido: userRole não é mais necessário com novo sistema
  const userEnterprise = user?.enterprise ?? null;
  const userSetor = user?.setor ?? null;
  const userMatricula = user?.matricula ?? null;
  const userFilialId = user?.filialId ?? null;
  const isFilialEnterprise =
    userEnterprise === "Box_Filial" || userEnterprise === "Cristallux_Filial";
  const isTotem = user?.role_config?.isTotem === true;

  // Verificar se os campos obrigatórios estão preenchidos (filial apenas para empresas do tipo filial)
  useEffect(() => {
    if (
      user &&
      (!userMatricula?.trim() ||
        !userEnterprise ||
        !userSetor ||
        (isFilialEnterprise && !userFilialId))
    ) {
      setShowProfileModal(true);
    }
  }, [
    user,
    userMatricula,
    userEnterprise,
    userSetor,
    userFilialId,
    isFilialEnterprise,
  ]);

  const todayBirthdays = useMemo(() => {
    if (!birthdays) {
      return [];
    }

    // Ajustar para usar o dia anterior (dia 09 ao invés do dia 10)
    const today = new Date();
    today.setDate(today.getDate() - 1); // SPE - FAMOSA GAMBIARRA
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();

    return birthdays.filter((birthday) => {
      const birthdayDate = new Date(birthday.data);
      return (
        birthdayDate.getDate() === currentDay &&
        birthdayDate.getMonth() === currentMonth
      );
    });
  }, [birthdays]);

  const hasTodayBirthdays = todayBirthdays.length > 0;

  const announcementShortcuts = useMemo(() => {
    const routes = routeItems(
      user?.role_config,
      false,
      user?.novidades === true,
    );
    const group = routes.find((m) => m.title === "Anúncios");
    const withHref =
      group?.children?.filter((c): c is RouteItem & { href: string } =>
        Boolean(c.href),
      ) ?? [];
    return withHref.filter((c) => {
      if (c.href === "/forms/hall-entrada") {
        return canViewHallEntrada(user?.role_config ?? null);
      }
      return true;
    });
  }, [user?.role_config, user?.novidades]);

  // Banners do carrossel principal, gerenciáveis em /admin/banners
  const { data: banners } = api.banner.list.useQuery();
  const posts = useMemo(
    () =>
      (banners ?? []).map((banner) => ({
        imageRef: banner.imageUrl,
        title: banner.title,
        href: banner.linkUrl,
      })),
    [banners],
  );

  const videos: {
    imageRef: string;
    title: string;
  }[] = [
    {
      imageRef: "https://www.youtube.com/embed/AIlQ-EM35UQ?si=RomGdNhQLn6CuzCw",
      title: "Institucional Cristallux",
    },
    {
      imageRef: "https://www.youtube.com/embed/nW-_4kfXE4U?si=tFAOWTij0oSkdcCm",
      title: "Apresentação Box Distribuidor",
    },
    {
      imageRef: "https://www.youtube.com/embed/iSdz3gxUpAI",
      title: "Valores Grupo RHenz",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Modal da Régua de Emoções */}
      <EmotionRulerWrapper />
      {/* Card de Boas-vindas para novos colaboradores */}
      <div className="w-full px-4 pb-4 pt-6 md:px-4 lg:px-8">
        <WelcomeCard />
      </div>

      {/* Seção Principal - Banners e Aniversários */}
      <div
        className={cn(
          "grid grid-cols-1 md:grid-cols-3",
          !hasTodayBirthdays && "md:grid-cols-1",
        )}
      >
        {posts.length > 0 && (
          <MainCarousel
            className={cn(
              "mx-auto w-full max-w-6xl px-4 md:col-span-2 md:max-w-[1920px] md:px-4 lg:px-8",
              !hasTodayBirthdays && "md:col-span-1",
            )}
            itens={posts}
          />
        )}
        {hasTodayBirthdays && (
          <BirthdaysCarousel
            className="w-full md:col-span-1"
            itens={todayBirthdays.map((b) => ({
              imageRef: b.imageUrl ?? b.user?.imageUrl ?? "",
              title: b.name,
            }))}
          />
        )}
      </div>
      <div className="mx-auto mt-6 w-full max-w-6xl space-y-4 px-4 md:mt-8 md:max-w-[1920px] md:space-y-6 md:px-4 lg:px-8">
        {/* Funcionalidades Mobile */}
        <div className="md:hidden">
          <h1 className="mb-4 text-2xl font-semibold md:mb-6 md:text-4xl">
            Funcionalidades
          </h1>
          <div className="mb-6 grid grid-cols-2 gap-3">
            {routeItems(user?.role_config, false, user?.novidades === true).map(
              (m, i) =>
                m.title !== "Dashboard" &&
                m.href && (
                  <div key={i} className="col-span-1">
                    <Link
                      href={m.href}
                      className="flex items-center justify-center gap-x-2 rounded-lg bg-muted p-3 text-sm transition-all hover:bg-primary/30"
                    >
                      <m.icon className="size-4" />
                      <span className="text-center leading-tight">
                        {m.title}
                      </span>
                    </Link>
                  </div>
                ),
            )}
          </div>
          {announcementShortcuts.length > 0 ? (
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <LucideMegaphone className="size-5 shrink-0" aria-hidden />
                <span>Anúncios</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {announcementShortcuts.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-center gap-x-2 rounded-lg bg-muted p-3 text-sm transition-all hover:bg-primary/30"
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="text-center leading-tight">
                      {item.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {/* Links Úteis, Universidade Corporativa e Ideias */}
      <div className="mx-auto mt-4 w-full max-w-6xl px-4 md:mt-6 md:max-w-[1920px] md:px-4 lg:px-8">
        <div
          className={cn(
            "grid grid-cols-1 gap-3 md:gap-4",
            isTotem ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {/* Links Úteis — apenas sites */}
          <div className="rounded-lg bg-muted p-3 md:p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold md:text-base">
              <LinkIcon className="size-4 md:size-5" />
              <span>Links Úteis</span>
            </div>
            <div>
              <div className="space-y-1.5 md:space-y-2">
                <Link
                  href={"https://boxdistribuidor.com.br"}
                  className="flex items-center rounded-sm bg-background/50 p-2 transition-all hover:bg-background/80 hover:shadow-sm active:scale-[0.98] md:p-2.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src="/LOGO BOX.png"
                    height={24}
                    width={24}
                    className="mr-2 size-5 flex-shrink-0 rounded-sm md:mr-3 md:size-6"
                    alt="Site Box"
                  />
                  <span className="text-xs font-medium md:text-sm">
                    Site Box
                  </span>
                </Link>
                <Link
                  href={"https://cristallux.com.br"}
                  className="flex items-center rounded-sm bg-background/50 p-2 transition-all hover:bg-background/80 hover:shadow-sm active:scale-[0.98] md:p-2.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src="/icon_cristal.svg"
                    height={24}
                    width={24}
                    className="mr-2 size-5 flex-shrink-0 rounded-sm md:mr-3 md:size-6"
                    alt="Cristallux"
                  />
                  <span className="text-xs font-medium md:text-sm">
                    Cristallux
                  </span>
                </Link>
                <Link
                  href={"https://centraldofuncionario.com.br/60939"}
                  className="flex items-center rounded-sm bg-background/50 p-2 transition-all hover:bg-background/80 hover:shadow-sm active:scale-[0.98] md:p-2.5"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src="/central-funcionario.ico"
                    height={24}
                    width={24}
                    className="mr-2 size-5 flex-shrink-0 rounded-sm md:mr-3 md:size-6"
                    alt="Central do Colaborador"
                  />
                  <span className="text-xs font-medium md:text-sm">
                    Central do Colaborador
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Universidade Corporativa */}
          <div className="rounded-lg bg-muted p-3 md:p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold md:text-base">
              <LucideGraduationCap className="size-4 shrink-0 md:size-5" />
              <span>Universidade Corporativa</span>
            </div>
            <div className="space-y-1.5 md:space-y-2">
              <Link
                href={"https://boxuni.rhenz.com.br"}
                className="flex items-center rounded-sm bg-background/50 p-2 transition-all hover:bg-background/80 hover:shadow-sm active:scale-[0.98] md:p-2.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/LOGO BOX.png"
                  height={24}
                  width={24}
                  className="mr-2 size-5 flex-shrink-0 rounded-sm md:mr-3 md:size-6"
                  alt="Box Uni"
                />
                <span className="text-xs font-medium md:text-sm">Box Uni</span>
              </Link>
              <Link
                href={"https://cristaluni.com.br"}
                className="flex items-center rounded-sm bg-background/50 p-2 transition-all hover:bg-background/80 hover:shadow-sm active:scale-[0.98] md:p-2.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/icon_cristal.svg"
                  height={24}
                  width={24}
                  className="mr-2 size-5 flex-shrink-0 rounded-sm md:mr-3 md:size-6"
                  alt="CristalUni"
                />
                <span className="text-xs font-medium md:text-sm">
                  CristalUni
                </span>
              </Link>
              <Link
                href={
                  "https://painel.umentor.com.br/cadastro_treinamento/?con_cod=ges449602&pla=5"
                }
                className="flex items-center rounded-sm bg-background/50 p-2 transition-all hover:bg-background/80 hover:shadow-sm active:scale-[0.98] md:p-2.5"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src="/umentor.jpg"
                  height={24}
                  width={24}
                  className="mr-2 size-5 flex-shrink-0 rounded-sm md:mr-3 md:size-6"
                  alt="Umentor"
                />
                <span className="text-xs font-medium md:text-sm">Umentor</span>
              </Link>
            </div>
          </div>

          {/* Card de Ideias - Não exibir para usuários Totem */}
          {!isTotem && (
            <div className="rounded-lg bg-muted p-3 md:col-span-2 md:p-4 xl:col-span-1">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold md:text-base">
                <span>Ideias</span>
              </h3>
              <SuggestionsWrapper />
            </div>
          )}
        </div>
      </div>
      <div className="w-full space-y-4 px-4 md:space-y-6 md:px-4 lg:px-8">
        {videos.length > 0 && (
          <VideosCarousel
            className="w-full"
            itens={videos}
            enterprise={userEnterprise}
          />
        )}
      </div>

      <div>
        <DashboardShell className="p-0">
          <NewsDisplay className="w-full" />
        </DashboardShell>
      </div>
      {/* Footer com Redes Sociais */}
      <div className="mt-8 border-t bg-muted/50 lg:mt-12">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 lg:gap-10">
            {/* Redes Sociais */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Redes Sociais
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-x-3">
                  <FaInstagram className="flex-shrink-0 text-pink-500" />
                  <div className="flex flex-wrap gap-x-2 text-sm">
                    <Link
                      href={"https://instagram.com/box.distribuidor"}
                      className="text-primary hover:underline"
                    >
                      @box.distribuidor
                    </Link>
                    <span className="text-muted-foreground">|</span>
                    <Link
                      href={"https://instagram.com/cristalluxled"}
                      className="text-primary hover:underline"
                    >
                      @cristalluxled
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-x-3">
                  <FaFacebook className="flex-shrink-0 text-blue-600" />
                  <div className="flex flex-wrap gap-x-2 text-sm">
                    <Link
                      href={"https://facebook.com/fiosecia.boxdistribuidor"}
                      className="text-primary hover:underline"
                    >
                      @fiosecia.boxdistribuidor
                    </Link>
                    <span className="text-muted-foreground">|</span>
                    <Link
                      href={"https://facebook.com/cristalluxled"}
                      className="text-primary hover:underline"
                    >
                      @cristalluxled
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-x-3">
                  <FaYoutube className="flex-shrink-0 text-red-500" />
                  <div className="flex flex-wrap gap-x-2 text-sm">
                    <Link
                      href={"https://youtube.com/@boxdistribuidor"}
                      className="text-primary hover:underline"
                    >
                      @boxdistribuidor
                    </Link>
                    <span className="text-muted-foreground">|</span>
                    <Link
                      href={"https://youtube.com/@cristallux"}
                      className="text-primary hover:underline"
                    >
                      @cristalluxled
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright e desenvolvedor */}
            <div className="flex flex-col items-center justify-end space-y-3 md:items-end">
              <motion.div
                variants={fadeInUp}
                transition={transitionDefault}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center gap-2 md:items-end"
              >
                <p className="text-center text-sm text-muted-foreground md:text-right md:text-base">
                  ©️ {new Date().getFullYear()} Elo | Intranet
                </p>

                {/* ALLPINES FOREVER */}
                <motion.a
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-3 py-1.5 text-xs text-foreground transition-all hover:border-primary/30 hover:from-primary/20 hover:via-primary/10 hover:to-primary/20 hover:shadow-md dark:border-primary/30 dark:from-primary/20 dark:via-primary/10 dark:to-primary/20 dark:hover:border-primary/40 dark:hover:from-primary/30 dark:hover:via-primary/20 dark:hover:to-primary/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-xs text-muted-foreground">
                    Feito com
                  </span>
                  <motion.span
                    animate={{
                      rotate: [0, -5, 5, -5, 0],
                      y: [0, -2, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: [0.4, 0, 0.6, 1] as const,
                    }}
                  >
                    <Coffee className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                  </motion.span>
                  <span className="text-xs text-muted-foreground">por</span>
                  <motion.span
                    className="text-xs font-semibold text-primary"
                    whileHover={{ x: 2 }}
                  >
                    EzLab
                  </motion.span>
                  <Sparkles className="h-3 w-3 text-primary/70 transition-transform group-hover:rotate-12 dark:text-primary/80" />
                </motion.a>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para completar perfil */}
      <CompleteProfileModal
        isOpen={showProfileModal}
        user={
          user?.id
            ? {
                id: user.id,
                matricula: user.matricula ?? null,
                enterprise: user.enterprise ?? null,
                setor: user.setor ?? null,
                filialId: user.filialId ?? null,
              }
            : null
        }
        onSuccess={() => {
          void refetchUser();
        }}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
