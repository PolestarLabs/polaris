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

    if (dry) return components;

    return this.edit({ components });
  };
  Eris.Message.prototype.removeButtons = async function (buttonIDs,options) {
    let currentComps = this.components || await this.getComponents();
    let newComps = currentComps
      .map((row) => {
        row.components = row.components.filter(
          (btn) => !buttonIDs.includes(btn.custom_id)
        );
        return row;
      })
      .filter((row) => row.components.length);

    if (options?.returnObj) return newComps; 
    if (currentComps === newComps) return;
    return this.edit({ components: newComps });
  };
  Eris.Message.prototype.removeComponentRow = async function (row,options) {
    let currentComps =  this.components || await this.getComponents();
    if (!currentComps[row]) return;
    currentComps.splice(row,1);
    let newComps = currentComps.filter((c) => !!c);

    if (options?.returnObj) return newComps; 
    if (currentComps === newComps) return;
    return this.edit({ components: newComps });
  };

  Eris.Message.prototype.addButtons = async function (buttons, row = 0) {
    let currentComps =  this.components || await this.getComponents();

    newButtons = currentComps.map((row) => row.components || []);
    if (newButtons[row]) newButtons[row] = [...newButtons[row], ...buttons];
    else newButtons[newButtons.length] = [...buttons];

    return this.setButtons(newButtons);
  };

  Eris.Message.prototype.disableButtons = async function (buttonIDs,options) {
    let currentComps =  !options?.enforce ? await this.getComponents() : this.components || await this.getComponents();
    let newComps = currentComps.map((row) => {
      row.components.forEach((btn) =>
        buttonIDs === "all" || buttonIDs.includes(btn.custom_id)
          ? (btn.disabled = true)
          : null
      );
      return row;
    });

    if (options?.returnObj) return newComps; 
    if (currentComps === newComps) return;
    return this.edit({ components: newComps });
  };

  Eris.Message.prototype.enableButtons = async function (buttonIDs,options) {
    let currentComps =  this.components || await this.getComponents();
    let newComps = currentComps.map((row) => {
      row.components.forEach((btn) =>
        buttonIDs === "all" || buttonIDs.includes(btn.custom_id)
          ? (btn.disabled = false)
          : null
      );
      return row;
    });

    if (options?.returnObj) return newComps; 
    if (currentComps === newComps) return;
    return this.edit({ components: newComps });
  };
  Eris.Message.prototype.updateButtons = function (btnData,options) {

    let currentComps = this.components;
    let newComps = currentComps.map((row, i) => {
      row.components.forEach((btn, ii) => {

        const matchButton = btnData.find((b) =>
          btn.custom_id.match(b.custom_id)
        );


        if (matchButton) {
          let oldname = btn.custom_id;
          Object.assign(btn, matchButton);
          btn.custom_id = oldname;

        }
      });
      return row;
    });

    if (options?.returnObj) return newComps; 
    if (currentComps === newComps) return;
    return this.edit({ components: newComps });
  };
};