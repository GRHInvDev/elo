import { describe, it, expect } from "vitest";
import { canEditForm } from "../access-control";
import type { RolesConfig } from "@/types/role-config";

const baseRoleConfig: RolesConfig = {
  sudo: false,
  admin_pages: [],
  can_create_form: false,
  can_create_event: false,
  can_create_flyer: false,
  can_create_booking: false,
  can_locate_cars: false,
  can_view_dre_report: false,
};

const formId = "form-1";
const creatorId = "user-creator";
const ownerId = "user-owner";
const otherUserId = "user-other";

describe("canEditForm", () => {
  describe("regra endurecida: apenas criador, owners, sudo ou can_create_form", () => {
    it("retorna false para usuário comum em formulário público (não-TOTEM)", () => {
      const result = canEditForm(
        { ...baseRoleConfig, isTotem: false },
        otherUserId,
        formId,
        {
          userId: creatorId,
          ownerIds: [ownerId],
          isPrivate: false,
          allowedUsers: [],
          allowedSectors: [],
        },
        "TI"
      );
      expect(result).toBe(false);
    });

    it("retorna false para usuário com acesso via allowedUsers em formulário privado", () => {
      const result = canEditForm(
        { ...baseRoleConfig, isTotem: false },
        otherUserId,
        formId,
        {
          userId: creatorId,
          ownerIds: [ownerId],
          isPrivate: true,
          allowedUsers: [otherUserId],
          allowedSectors: [],
        },
        "Vendas"
      );
      expect(result).toBe(false);
    });

    it("retorna false para usuário com acesso via allowedSectors em formulário privado", () => {
      const result = canEditForm(
        { ...baseRoleConfig, isTotem: false },
        otherUserId,
        formId,
        {
          userId: creatorId,
          ownerIds: [],
          isPrivate: true,
          allowedUsers: [],
          allowedSectors: ["TI"],
        },
        "TI"
      );
      expect(result).toBe(false);
    });
  });

  describe("criador e owners sempre podem editar", () => {
    it("retorna true quando o usuário é o criador do formulário", () => {
      const result = canEditForm(
        { ...baseRoleConfig },
        creatorId,
        formId,
        {
          userId: creatorId,
          ownerIds: [ownerId],
          isPrivate: true,
          allowedUsers: [],
          allowedSectors: [],
        },
        null
      );
      expect(result).toBe(true);
    });

    it("retorna true quando o usuário está em ownerIds", () => {
      const result = canEditForm(
        { ...baseRoleConfig },
        ownerId,
        formId,
        {
          userId: creatorId,
          ownerIds: [ownerId],
          isPrivate: true,
          allowedUsers: [],
          allowedSectors: [],
        },
        null
      );
      expect(result).toBe(true);
    });
  });

  describe("sudo e can_create_form podem editar qualquer formulário", () => {
    it("retorna true quando role_config.sudo é true", () => {
      const result = canEditForm(
        { ...baseRoleConfig, sudo: true },
        otherUserId,
        formId,
        {
          userId: creatorId,
          ownerIds: [ownerId],
          isPrivate: true,
          allowedUsers: [],
          allowedSectors: [],
        },
        null
      );
      expect(result).toBe(true);
    });

    it("retorna true quando role_config.can_create_form é true", () => {
      const result = canEditForm(
        { ...baseRoleConfig, can_create_form: true },
        otherUserId,
        formId,
        {
          userId: creatorId,
          ownerIds: [],
          isPrivate: false,
          allowedUsers: [],
          allowedSectors: [],
        },
        null
      );
      expect(result).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("retorna false quando roleConfig é null", () => {
      const result = canEditForm(
        null,
        creatorId,
        formId,
        { userId: creatorId, ownerIds: [], isPrivate: false },
        null
      );
      expect(result).toBe(false);
    });

    it("retorna false quando userId é null/undefined", () => {
      const result = canEditForm(
        { ...baseRoleConfig },
        undefined,
        formId,
        { userId: creatorId, ownerIds: [], isPrivate: false },
        null
      );
      expect(result).toBe(false);
    });

    it("retorna false quando usuário é TOTEM", () => {
      const result = canEditForm(
        { ...baseRoleConfig, isTotem: true },
        creatorId,
        formId,
        { userId: creatorId, ownerIds: [], isPrivate: false },
        null
      );
      expect(result).toBe(false);
    });
  });
});
