import type {
  IMeUser,
  IMessageResponse,
  IPaginatedResponse,
  TChangePasswordData,
  TCreateUserData,
  TUpdateMeData,
  TUpdateUserData,
  TUserListQuery,
  TUserResponse,
} from "@moon-tailors/contracts";
import { BaseService } from "~/lib/api";

/** List/get row shape from Users API (entity fields, not IUser.name DTO). */
export type TUserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
};

export function userDisplayName(user: {
  firstName?: string;
  lastName?: string;
  name?: string;
}): string {
  if (user.name?.trim()) return user.name.trim();
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
}

class UsersService extends BaseService<
  TUserRow,
  TCreateUserData,
  TUpdateUserData
> {
  constructor() {
    super("/users");
  }

  getMe() {
    return this.getSingle<IMeUser>(undefined, undefined, "/me");
  }

  updateMe(body: TUpdateMeData) {
    return this.patch<IMeUser>(undefined)(
      body as unknown as TUpdateUserData,
      undefined,
      "/me",
    );
  }

  changePassword(body: TChangePasswordData) {
    return this.patch<IMessageResponse>(undefined)(
      body as unknown as TUpdateUserData,
      undefined,
      "/me/password",
    );
  }

  list(query: Partial<TUserListQuery> = {}) {
    const { page = 1, limit = 20, ...rest } = query;
    return this.get<TUserRow>({
      page,
      limit,
      ...rest,
    }) as Promise<IPaginatedResponse<TUserRow>>;
  }

  getOne(id: string) {
    return this.getSingle(id);
  }

  create(body: TCreateUserData) {
    return this.post(body) as Promise<TUserResponse>;
  }

  update(id: string, body: TUpdateUserData) {
    return this.patch<IMessageResponse>(id)(body);
  }

  remove(id: string) {
    return this.delete(id) as Promise<IMessageResponse>;
  }
}

export const usersService = new UsersService();
