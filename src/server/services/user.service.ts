export async function getMe(user: any) {
  return { success: true, user };
}

export async function logout() {
  return { success: true };
}
