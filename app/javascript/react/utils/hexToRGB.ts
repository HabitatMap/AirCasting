function hexToRGBA(hex: string, opacity: number): string {
    // Remove the hash symbol if present
    hex = hex.replace('#', '');

    // Parse the hex color
    var r = parseInt(hex.substring(0,2), 16);
    var g = parseInt(hex.substring(2,4), 16);
    var b = parseInt(hex.substring(4,6), 16);

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default hexToRGBA;
