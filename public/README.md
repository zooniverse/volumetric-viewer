Kameswara - start here! Here are the steps for screenshot generation. I couldn't figure out how to fully automate it, so it's semi-manual.

Step 1: In the b64 folder, put all the .json files you want to generate screenshots for. There are 2 sample files to show you the format.
Step 2: update the `datafiles.json` file with the name of each file you want to generate screenshots for. This tells the viewer where to find the data for that named file.
Step 3: Start the react server. You may need to do `npm install` first to get everything running locally. After that, run `npm run dev` and open `http://localhost:3000` in your browser.
Step 4: Click "Save Screenshot" to save a png with the same filename as the json file you created
Step 5: Select the next file from the select dropdown, wait for it to load, and then click "Save Screenshot". Repeat until you have all the screenshots you need.