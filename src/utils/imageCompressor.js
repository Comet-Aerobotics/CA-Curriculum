/**
 * Resizes and compresses an uploaded image file into a lightweight JPEG Base64 Data URL.
 * Fits within Firestore document limits for 100% free Spark plan storage.
 */
export function compressImageToBase64(file, maxWidth = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image.'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64DataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(base64DataUrl);
      };

      img.onerror = (err) => reject(new Error('Failed to load image for compression.'));
    };

    reader.onerror = (err) => reject(new Error('Failed to read image file.'));
  });
}
