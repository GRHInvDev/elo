import { describe, it, expect } from "vitest"
import { canManageNewUsersHall } from "../access-control"
import type { RolesConfig } from "@/types/role-config"

const base: RolesConfig = {
  sudo: false,
  admin_pages: [],
  can_create_form: false,
  can_create_event: false,
  can_create_flyer: false,
  can_create_booking: false,
  can_locate_cars: false,
  can_create_solicitacoes: false,
  can_view_dre_report: false,
}

describe("canManageNewUsersHall", () => {
  it("retorna false quando role_config é null", () => {
    expect(canManageNewUsersHall(null)).toBe(false)
  })

  it("retorna true para sudo", () => {
    expect(canManageNewUsersHall({ ...base, sudo: true })).toBe(true)
  })

  it("retorna true quando can_manage_new_users_hall é true", () => {
    expect(
      canManageNewUsersHall({ ...base, can_manage_new_users_hall: true }),
    ).toBe(true)
  })

  it("retorna false quando can_manage_new_users_hall está ausente ou false", () => {
    expect(canManageNewUsersHall({ ...base })).toBe(false)
    expect(canManageNewUsersHall({ ...base, can_manage_new_users_hall: false })).toBe(
      false,
    )
  })
})
