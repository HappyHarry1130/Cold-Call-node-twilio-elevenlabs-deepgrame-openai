const { chromium } = require("playwright");

const makeschedule = async (url, name, email) => {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);

    await page.fill("#full_name_input", name);

    await page.fill("#email_input", email);

    const fullNameValue = await page.evaluate(() => {
      return document.getElementById("full_name_input").value;
    });
    console.log(`Full Name: ${fullNameValue}`);

    const emailValue = await page.evaluate(() => {
      return document.getElementById("email_input").value;
    });
    console.log(`Email: ${emailValue}`);


    // Bypass the cookie consent banner by hiding it
    await page.evaluate(() => {
      const banner = document.getElementById("onetrust-banner-sdk");
      if (banner) {
        banner.style.display = "none";
      }
    });

    await page.waitForSelector('//*[@id="root"]/div/div/div/div/div[2]/div/div/form/button/span', { state: 'visible' });
    await page.click('//*[@id="root"]/div/div/div/div/div[2]/div/div/form/button/span', { timeout: 60000 });



    const errorMessage = await page.evaluate(() => {
      const errorElement = document.querySelector(".ctl3io2 .b1rtbe9g");
      return errorElement ? errorElement.textContent : null;
    });

    if (errorMessage) {
      console.error(`Error: ${errorMessage}`);
    }
  } catch (error) {
    console.error("Error during scheduling:", error);
  } finally {
    if (browser) {
    }
  }
};

module.exports = { makeschedule };
