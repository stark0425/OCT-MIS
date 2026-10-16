
async function loadCloud() {
  try {
    if (!supabaseClient) {
      console.error("Supabase client is not initialized.");
      const status = $("syncStatus");
      if (status) status.textContent = "● CLOUD ERROR";
      return false;
    }

    const { data, error } = await supabaseClient
      .from("business_oct")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase Cloud Error:", error);

      const status = $("syncStatus");
      if (status) status.textContent = "● CLOUD ERROR — CHECK CONSOLE";

      return false;
    }

    if (!Array.isArray(data)) {
      console.error("Supabase returned unexpected data:", data);
      return false;
    }

    rows = data;

    try {
      localStorage.setItem("oct_mis_rows", JSON.stringify(rows));
    } catch (storageError) {
      console.warn("Local cache could not be updated:", storageError);
    }

    const status = $("syncStatus");
    if (status) status.textContent = "● CLOUD SYNC";

    return true;
  } catch (error) {
    console.error("Cloud connection failed:", error);

    const status = $("syncStatus");
    if (status) status.textContent = "● CLOUD ERROR";

    return false;
  }
}

async function saveRow(r) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("business_oct")
        .insert([r])
        .select()
        .single();

      if (error) {
        console.error("Supabase Save Error:", error);
        alert("Could not save the policy to the cloud: " + error.message);
        return false;
      }

      rows.unshift(data);

      try {
        localStorage.setItem("oct_mis_rows", JSON.stringify(rows));
      } catch (storageError) {
        console.warn("Local cache could not be updated:", storageError);
      }

      return true;
    } catch (error) {
      console.error("Save failed:", error);
      alert("Policy save failed. Please check the browser console.");
      return false;
    }
  }

  // Local-only fallback when Supabase is not configured.
  r.id = "local-" + Date.now();
  rows.unshift(r);

  try {
    localStorage.setItem("oct_mis_rows", JSON.stringify(rows));
  } catch (storageError) {
    console.error("Local save failed:", storageError);
    alert("Could not save the policy locally.");
    return false;
  }

  return true;
}

const EMPLOYEE_MASTER = [
  "HIMANSHU",
  "RAJAN",
  "ROHIT",
  "AKASH",
  "KAIF",
  "NIKHIL",
  "KAVYANSH",
  "PRINCE",
  "SUMAN"
];
