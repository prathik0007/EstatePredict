import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let net = null;
let loadingPromise = null;

export async function getMobileNet() {
  if (net) return net;
  if (!loadingPromise) {
    loadingPromise = mobilenet.load({
      version: 2,
      alpha: 1.0
    }).then(model => {
      net = model;
      return net;
    }).catch(err => {
      console.warn('[ImageVerifier] MobileNet load error:', err);
      loadingPromise = null;
      return null;
    });
  }
  return loadingPromise;
}

export const NON_PROPERTY_PATTERNS = [
  // Bowls, dishes, utensils, tableware, kitchenware
  /bowl/i, /plate/i, /dish/i, /saucer/i, /cup\b/i, /mug\b/i, /spoon/i, /fork\b/i, /knife/i,
  /pitcher/i, /jug\b/i, /teapot/i, /coffeepot/i, /wok\b/i, /pot\b/i, /pan\b/i, /utensil/i, /cutlery/i,
  /spatula/i, /ladle/i, /measuring/i, /saltshaker/i,
  // Food & beverages
  /food/i, /pizza/i, /soup/i, /salad/i, /sandwich/i, /burger/i, /hotdog/i, /bread/i,
  /cake/i, /ice cream/i, /fruit/i, /apple/i, /banana/i, /orange\b/i, /berry/i, /lemon/i,
  /vegetable/i, /broccoli/i, /carrot/i, /cucumber/i, /meat/i, /drink/i, /beer/i, /wine/i,
  /bottle/i, /cocktail/i, /espresso/i,
  // Plants & flowers
  /flower/i, /plant/i, /daisy/i, /rose\b/i, /tulip/i, /sunflower/i, /leaf/i, /tree/i,
  /vase/i, /flowerpot/i, /mushroom/i, /cactus/i, /succulent/i, /blossom/i,
  // Animals & pets
  /dog/i, /cat\b/i, /puppy/i, /kitten/i, /hound/i, /terrier/i, /retriever/i, /bird/i,
  /parrot/i, /duck\b/i, /chicken/i, /horse/i, /cow\b/i, /pig\b/i, /sheep/i, /fish\b/i, /frog/i,
  /insect/i, /butterfly/i, /spider/i, /beetle/i, /wildlife/i, /pet\b/i,
  // Vehicles
  /car\b/i, /cab\b/i, /taxi/i, /truck/i, /vehicle/i, /bus\b/i, /motorcycle/i, /scooter/i,
  /bicycle/i, /bike/i, /airplane/i, /boat/i,
  // Personal items & clothes
  /shoe/i, /sneaker/i, /boot\b/i, /sandal/i, /dress\b/i, /shirt/i, /suit\b/i, /hat\b/i,
  /sunglasses/i, /glasses/i, /bag\b/i, /backpack/i, /purse/i, /wallet/i, /watch\b/i,
  // Electronics, tools & objects
  /phone/i, /laptop/i, /computer/i, /keyboard/i, /mouse\b/i, /monitor\b/i, /screen\b/i,
  /camera/i, /remote/i, /hammer/i, /screwdriver/i, /pliers/i, /scissors/i, /candle/i
];

export const PROPERTY_PATTERNS = [
  /patio/i, /terrace/i, /balcony/i, /courtyard/i, /veranda/i,
  /couch/i, /sofa/i, /daybed/i, /studio couch/i,
  /wardrobe/i, /closet/i, /bookcase/i, /bookshelf/i,
  /dining table/i, /dining room/i,
  /four-poster/i, /cradle/i,
  /window shade/i, /window screen/i, /sliding door/i,
  /palace/i, /castle/i, /monastery/i, /boathouse/i, /greenhouse/i,
  /church/i, /home\b/i, /house\b/i, /building/i, /room\b/i, /hall\b/i, /architecture/i
];

export const PROPERTY_FILENAME_REGEX = /(room|house|home|apt|apartment|villa|flat|suite|living|bed|bedroom|kitchen|bath|bathroom|exterior|property|hall|balcony|patio|facade|building|condo)/i;

/**
 * Verifies whether an image (file, img element, or filename) represents authentic real estate.
 * Uses filename heuristics and browser-side MobileNet computer vision.
 */
export async function verifyUploadedImage(imgElementOrFile, originalFilename = '') {
  const filename = originalFilename || (imgElementOrFile && imgElementOrFile.name) || '';
  
  // 1. Positive filename check (houses, rooms, apartments, villas)
  if (filename && PROPERTY_FILENAME_REGEX.test(filename)) {
    return {
      isProperty: true,
      detectedType: 'Residential Property'
    };
  }

  // 2. Negative filename check (bowls, plants, animals, cars, objects)
  if (filename) {
    const fn = filename.toLowerCase();
    for (const pat of NON_PROPERTY_PATTERNS) {
      if (pat.test(fn)) {
        const match = fn.match(pat);
        const term = match ? match[0] : 'Object';
        return {
          isProperty: false,
          detectedType: `Object / Item (${term})`,
          reason: `Detected non-property keyword (${term}) in image. EstatePredict only evaluates residential real estate properties (houses, apartments, rooms, villas).`
        };
      }
    }
  }

  // 2. MobileNet computer vision check
  let imgElement = null;
  if (imgElementOrFile instanceof HTMLImageElement) {
    imgElement = imgElementOrFile;
  } else if (imgElementOrFile instanceof File || imgElementOrFile instanceof Blob) {
    try {
      imgElement = await createImageElementFromFile(imgElementOrFile);
    } catch (_) {
      imgElement = null;
    }
  }

  if (imgElement) {
    try {
      const model = await getMobileNet();
      if (model) {
        const predictions = await model.classify(imgElement, 5);
        if (predictions && predictions.length > 0) {
          const top = predictions[0];
          const topClass = top.className.toLowerCase();

          // Check if top class is a residential property/room
          for (const pat of PROPERTY_PATTERNS) {
            if (pat.test(topClass)) {
              return {
                isProperty: true,
                detectedType: 'Residential Property',
                probability: top.probability
              };
            }
          }

          // Check if top class is a non-property object
          for (const pat of NON_PROPERTY_PATTERNS) {
            if (pat.test(topClass)) {
              return {
                isProperty: false,
                detectedType: `Non-Property Object (${top.className})`,
                probability: top.probability,
                reason: `Visual classifier identified this image as "${top.className}" (${Math.round(top.probability * 100)}% confidence). EstatePredict only evaluates authentic real estate properties (houses, apartments, rooms, villas).`
              };
            }
          }

          // Check if any prediction strongly identifies an object
          for (const pred of predictions) {
            if (pred.probability > 0.40) {
              const nameLower = pred.className.toLowerCase();
              for (const pat of NON_PROPERTY_PATTERNS) {
                if (pat.test(nameLower)) {
                  return {
                    isProperty: false,
                    detectedType: `Non-Property Object (${pred.className})`,
                    probability: pred.probability,
                    reason: `Visual classifier identified "${pred.className}" in this image (${Math.round(pred.probability * 100)}% confidence). EstatePredict only evaluates authentic real estate properties.`
                  };
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('[ImageVerifier] MobileNet inference error:', err);
    }
  }

  return {
    isProperty: true,
    detectedType: 'Residential Property'
  };
}

function createImageElementFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      reject(e);
    };
    img.src = url;
  });
}

