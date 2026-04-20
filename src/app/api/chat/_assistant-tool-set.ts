import type { Tool } from "ai"
import type { RolesConfig } from "@/types/role-config"
import {
  createBooking,
  deleteBooking,
  listBookingByDate,
  listNowAvailableRooms,
  listRooms,
  listUserBooking,
} from "./_tools/rooms"
import {
  getUserRentedVehicle,
  listAvailableVehiclesNow,
  listCars,
  rentVehicle,
} from "./_tools/cars"
import {
  getMyLunchOrderForDate,
  listLunchMenuItems,
  listLunchRestaurants,
  submitLunchOrder,
} from "./_tools/food-order"
import {
  createIdea,
  getMenuCafeteria,
  getMySchedule,
  listFormsForHelp,
  notifyColleague,
  registerSolicitation,
  searchColleague,
} from "./_tools/intranet"
import { createMyIdea, getMyIdeaByNumber, listMyIdeas } from "./_tools/ideas"

/** Ferramentas expostas ao modelo conforme o perfil (Totem = somente leitura / consulta). */
export function getAssistantToolSetForRole(role: RolesConfig): Record<string, Tool> {
  if (role.isTotem === true) {
    return {
      listCars,
      listAvailableVehiclesNow,
      getUserRentedVehicle,
      listRooms,
      listNowAvailableRooms,
      listBookingByDate,
      getMySchedule,
      listUserBooking,
      searchColleague,
      listFormsForHelp,
      getMenuCafeteria,
      getMyLunchOrderForDate,
    }
  }

  return {
    listCars,
    listAvailableVehiclesNow,
    getUserRentedVehicle,
    rentVehicle,
    listRooms,
    listNowAvailableRooms,
    createBooking,
    listUserBooking,
    deleteBooking,
    listBookingByDate,
    getMySchedule,
    searchColleague,
    listFormsForHelp,
    registerSolicitation,
    createIdea,
    getMenuCafeteria,
    notifyColleague,
    listLunchRestaurants,
    listLunchMenuItems,
    getMyLunchOrderForDate,
    submitLunchOrder,
    listMyIdeas,
    getMyIdeaByNumber,
    createMyIdea,
  }
}

export function getAssistantTotemSystemAppend(): string {
  return `
## Perfil deste usuário: TOTEM (quiosque / acesso limitado)

Este usuário está em perfil **somente consulta**:
- Pode usar ferramentas para **consultar** salas livres, ocupação em intervalo, cardápio do refeitório, pedido de almoço já feito (se houver), frota, disponibilidade de veículos, **listagem de formulários** (apenas títulos/disponibilidade) e **busca de colegas** (ramal/e-mail/setor).
- **Não** estão disponíveis nesta sessão: reservar ou cancelar salas, alugar veículos, novo pedido de marmita, registrar solicitações ou ideias, enviar notificações a colegas ou fluxos que alterem dados.
- Se o usuário pedir uma dessas ações, explique de forma breve e cordial e oriente a usar o login pessoal na intranet ou outro canal indicado pela empresa.
`
}
