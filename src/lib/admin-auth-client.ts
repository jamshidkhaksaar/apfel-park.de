export const createAdminBrowserClient = () => {
  return {
    auth: {
      signOut: async () => {
        const response = await fetch("/api/admin/logout", {
          method: "POST",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error('Logout failed');
      },
    },
  };
};
