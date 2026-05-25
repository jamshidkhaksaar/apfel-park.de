export const createAdminBrowserClient = () => {
  return {
    auth: {
      signOut: async () => {
        await fetch("/api/admin/logout", {
          method: "POST",
          credentials: "same-origin",
        });
      },
    },
  };
};
