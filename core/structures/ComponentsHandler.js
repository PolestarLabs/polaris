module.exports = function (Eris) {
  Eris.Message.prototype.getComponents = async function () {
    this.components =
      (
        await this._client.requestHandler.request(
          "GET",
          `/channels/${this.channel.id}/messages/${this.id}`,
          true
        )
      ).components || [];
    return this.components;
  };
  Eris.Message.prototype.setButtons = function (buttons, dry) {
    if (buttons.length > 5) return Promise.reject("Max 5 Rows");
    if (buttons.some?.((b) => b.length > 5))
      return Promise.reject("Max 5 Buttons");

    if (!buttons[0]?.length) buttons = [buttons];

    const components = buttons.map((row) => {
      return {
        type: 1,
        components: row.map?.((btn, i) => {
          return {
            type: 2,
            label: btn.label,
            custom_id: btn.custom_id || `button-${this.id}-${i}`,
            style: btn.style || 2,
            disabled: btn.disabled,
            emoji: btn.emoji,
          };
        }) || [Object.assign({ type: 2 }, row)],
      };
    });

    console.log({ dry });
    if (dry) return components;
    console.log("past drycheck");

    return this.edit({
      content: this.content,
      components,
    });
  };
  Eris.Message.prototype.removeButtons = async function (buttonIDs) {
    let currentComps = await this.getComponents();
    let newComps = currentComps
      .map((row) => {
        row.components = row.components.filter(
          (btn) => !buttonIDs.includes(btn.custom_id)
        );
        return row;
      })
      .filter((row) => row.components.length);

    return this.edit({ content: this.content, components: newComps });
  };
  Eris.Message.prototype.removeComponentRow = async function (row) {
    let currentComps = await this.getComponents();
    currentComps[row] = null;
    let newComps = currentComps.filter((c) => !!c);

    return this.edit({ content: this.content, components: newComps });
  };
  Eris.Message.prototype.addButtons = async function (buttons, row = 0) {
    let currentComps = await this.getComponents();

    newButtons = currentComps.map((row) => row.components || []);
    if (newButtons[row]) newButtons[row] = [...newButtons[row], ...buttons];
    else newButtons[newButtons.length] = [...buttons];

    return this.setButtons(newButtons);
  };

  Eris.Message.prototype.disableButtons = async function (buttonIDs) {
    let currentComps = await this.getComponents();
    let newComps = currentComps.map((row) => {
      row.components.forEach((btn) =>
        buttonIDs === "all" || buttonIDs.includes(btn.custom_id)
          ? (btn.disabled = true)
          : null
      );
      return row;
    });
    return this.edit({ content: this.content, components: newComps });
  };

  Eris.Message.prototype.enableButtons = async function (buttonIDs) {
    let currentComps = await this.getComponents();
    let newComps = currentComps.map((row) => {
      row.components.forEach((btn) =>
        buttonIDs === "all" || buttonIDs.includes(btn.custom_id)
          ? (btn.disabled = false)
          : null
      );
      return row;
    });
    return this.edit({ content: this.content, components: newComps });
  };
  Eris.Message.prototype.updateButtons = async function (btnData) {
    console.log("-------BUTTON UPDATE-------------------------".yellow);
    let currentComps = await this.getComponents();
    let newComps = currentComps.map((row, i) => {
      row.components.forEach((btn, ii) => {
        console.log(`ROW ${i}, BUTTON ${ii}`.gray);
        console.log("BTN".red, btn);
        const matchButton = btnData.find((b) =>
          btn.custom_id.match(b.custom_id)
        );
        console.log("matchButton".yellow, matchButton);

        if (matchButton) {
          let oldname = btn.custom_id;
          Object.assign(btn, matchButton);
          btn.custom_id = oldname;
          console.log("NEWBTN".green, btn);
        }
      });
      return row;
    });
    console.log("-------BUTTON UPDATE END-------------------------\n\n.".gray);
    return this.edit({ content: this.content, components: newComps });
  };
};