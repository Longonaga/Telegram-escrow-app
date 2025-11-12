function inline(labelsRow1, dataRow1, labelsRow2, dataRow2) {
  // convenience: build inline keyboard; accepts either single row or two rows
  const keyboard = { reply_markup: { inline_keyboard: [] } };
  if (labelsRow1 && dataRow1) keyboard.reply_markup.inline_keyboard.push([
    { text: labelsRow1[0] || labelsRow1, callback_data: dataRow1[0] || dataRow1 }
  ].map((b, i) => ({ text: Array.isArray(labelsRow1) ? labelsRow1[i] : labelsRow1, callback_data: Array.isArray(dataRow1) ? dataRow1[i] : dataRow1 })));
  // simple helper for the scaffold — flows may build richer keyboards
  return keyboard;
}

module.exports = { inline };
