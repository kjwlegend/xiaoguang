import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
	id: number;
	nickname: string;
	avatar: string | null;
	type: string;
	constellation: string | null;
	birthday: string | null;
	gender: string;
	email: string;
	inviter: string | null;
	invite_code: string | null;
	invite_count: number;
	membership_level: string;
	phone_number: string | null;
	username: string;
	membership_expiry_date: string;
	last_refresh_date: string;
	user_balance: {
		chat_balance: number;
		draw_balance: number;
		xgb_balance: number;
		tarot_balance: number;
		tarot_total: number;
	};
}

export interface UserStore {
	user: User;
	updateNickname: (nickname: string) => void;
	updateModelPreference: (modelPreference: string) => void;
	setUser: (user: User) => void;
	clearUser: () => void;
	updateUser: (user: User) => void;
}
export const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			user: {
				id: 0,
				nickname: "",
				avatar: null,
				type: "",
				constellation: null,
				birthday: null,
				gender: "",
				email: "",
				inviter: null,
				invite_code: null,
				invite_count: 0,
				membership_level: "",
				phone_number: null,
				username: "",
				membership_expiry_date: "",
				last_refresh_date: "",
				user_balance: {
					chat_balance: 0,
					draw_balance: 0,
					xgb_balance: 0,
					tarot_balance: 0,
					tarot_total: 0,
				},
			},

			updateNickname: (nickname) => {
				set((state) => ({
					user: {
						...state.user,
						nickname,
					},
				}));
			},
			updateModelPreference: (modelPreference) => {
				set((state) => ({
					user: {
						...state.user,
						modelPreference,
					},
				}));
			},
			setUser: (user: User) => set({ user }),
			updateUser: (user: User) => {
				set((state) => ({
					user: {
						...state.user,
						...user,
					},
				}));
			},
			clearUser: () => {
				set((state) => ({
					user: {
						...state.user,
						id: 0,
						nickname: "",
						avatar: null,
						type: "",
						constellation: null,
						birthday: null,
						gender: "",
						email: "",
						inviter: null,
						invite_code: null,
						invite_count: 0,
						membership_level: "",
						phone_number: null,
						username: "",
						membership_expiry_date: "",
						last_refresh_date: "",
						user_balance: {
							chat_balance: 0,
							draw_balance: 0,
							xgb_balance: 0,
							tarot_balance: 0,
							tarot_total: 0,
						},
					},
				}));
			},
		}),
		{
			name: "user-store",
			version: 1,
		},
	),
);
