// Regex patterns to remove XML from JSON, otherwise JSON.parse call fails
const VDMRegex = /"video_dash_manifest": ".+",/;
const DMRegex = /"dash_manifest": ".+",/;

// Helper function to combine regex patterns to one
const getComposedRegex = (...regexes) =>
  new RegExp(regexes.map((regex) => regex.source).join("|"));

const composedReg = getComposedRegex(VDMRegex, DMRegex);

// Retrieve json from legacy api containing original video link
async function getVideo() {
  const response = await fetch(window.location.href + "?__a=1&__d=dis");
  const text = await response.text();
  return parseResponse(text);
}

// Parse the response into json (after fixing it)
const parseResponse = function (textResponse) {
  const parsed = JSON.parse(textResponse.replace(composedReg, ""));

  // Open video in new window
  if (parsed.items[0].hasOwnProperty("video_versions")) {
    window.open(parsed.items[0].video_versions[0].url);
    return;
  }

  // If there are multiple videos, log each link (as chrome blocks opening multiple tabs at once)
  if (parsed.items[0].hasOwnProperty("carousel_media")) {
    for (let i in parsed.items[0].carousel_media) {
      if (parsed.items[0].carousel_media[i].hasOwnProperty("video_versions")) {
        console.log(parsed.items[0].carousel_media[i].video_versions[0].url);
      }
    }
  }
};

getVideo();
