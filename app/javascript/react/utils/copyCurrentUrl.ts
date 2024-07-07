export const copyCurrentURL = (link: string) => {
  const currentURL = link;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(currentURL)
      .then(() => {
        console.log("URL copied!");
      })
      .catch((error) => {
        console.error("Failed to copy URL: ", error);
      });
  } else {
    // Fallback for browsers that do not support Clipboard API
    const tempInput = document.createElement("input");
    tempInput.style.position = "absolute";
    tempInput.style.left = "-1000px";
    tempInput.value = currentURL;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);
    alert("URL copied!");
    tempInput.onerror = (e) => {
      console.log(e.toString);
    };
  }
};
