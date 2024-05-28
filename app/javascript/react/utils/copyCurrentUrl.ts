export const copyCurrentURL = () => {
  const currentURL = window.location.href;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(currentURL)
      .then(() => {
        alert("URL copied!");
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
