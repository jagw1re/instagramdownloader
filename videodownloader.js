// Regex patterns to remove XML from JSON, otherwise JSON.parse call fails
const VDMRegex = /"video_dash_manifest": ".+",/;
const DMRegex = /"dash_manifest": ".+",/;

// Helper function to combine regex patterns to one
const getComposedRegex = (...regexes) =>
  new RegExp(regexes.map((regex) => regex.source).join("|"));

const composedReg = getComposedRegex(VDMRegex, DMRegex);

/**
 * Retrieve json from legacy api containing original video link
 */
async function getVideo() {
  const url = window.location.href.split('?')[0]
  const response = await fetch(url + "?__a=1&__d=dis");
  const text = await response.text();
  parseResponse(text);
}

/**
 * Parses the response to remove broken xml and retrieve the video url and id
 * @param {string} textResponse Response from deprecated API call to get vid info
 * @returns {undefined} Only returns to exit early
 */
const parseResponse = async function (textResponse) {
  const parsed = JSON.parse(textResponse.replace(composedReg, ""));

  if (parsed.hasOwnProperty("graphql")) {
    download(parsed.graphql.shortcode_media.video_url, parsed.graphql.shortcode_media.id)
    return
  }

  // Open video in new window
  if (parsed.items[0].hasOwnProperty("video_versions")) {
    download(parsed.items[0].video_versions[0].url, parsed.items[0].id);
    return;
  }

  // If there are multiple videos, log each link (as chrome blocks opening multiple tabs at once)
  if (parsed.items[0].hasOwnProperty("carousel_media")) {
    for (let i in parsed.items[0].carousel_media) {
      if (parsed.items[0].carousel_media[i].hasOwnProperty("video_versions")) {
        download(parsed.items[0].carousel_media[i].video_versions[0].url, parsed.items[0].carousel_media[i].id);
      }
    }
  }
};

/**
 * Takes a video resource location and name and downloads.
 * @param {string} url Path the video resource
 * @param {string} name Name to download the file as
 */
async function download(url, name) {
  // Retrieve the resource, set referrer to bypass cross-origin restriction
  const res = await fetch(url, {
    referrer: "instagram.com",
  });

  // Convert response to blob type
  const file = await res.blob();
  // Set up no-click download tag to automate vid download
  const tempUrl = URL.createObjectURL(file);
  const aTag = document.createElement("a");
  aTag.href = tempUrl;
  aTag.download = name;
  document.body.appendChild(aTag);

  // Fake click the link to trigger download and cleanup
  aTag.click();
  URL.revokeObjectURL(tempUrl);
  aTag.remove();
}

getVideo();
