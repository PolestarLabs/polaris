function arrow(color,number=1) {
    let arrow;
    if (color === "green") arrow= ``.black.bgGreen + ``.green.bgBlack;
    if (color === "red") arrow= ``.black.bgRed + ``.red.bgBlack;
    if (color === "yellow") arrow= ``.black.bgYellow + ``.yellow.bgBlack;
    
    if (number > 1) arrow = arrow.repeat(number);
    return arrow;
}


module.exports = { arrow }