const template = `
<div class="font-options">
  <div class="font-option">
    <label for="font">Font</label>
    <select id="font"></select>
  </div>
  <div class="font-option">
    <label for="text-direction">Text Direction</label>
    <select id="text-direction"></select>
  </div>
  <div class="font-option font-option-number">
    <label for="font-size">Font Size</label>
    <input id="font-size" name="font-size" type="number" />
  </div>
  <div class="font-option font-option-number">
    <label for="line-height">Line Height</label>
    <input
      id="line-height"
      name="line-height"
      type="number"
      min="0.1"
      step="0.1"
    />
  </div>
  <div class="font-option font-option-number">
    <label for="max-width">Max Width</label>
    <input
      id="max-width"
      name="max-width"
      type="number"
      placeholder="px"
    />
  </div>
  <div class="font-option font-option-number">
    <label for="max-height">Max Height</label>
    <input
      id="max-height"
      name="max-height"
      type="number"
      placeholder="px"
    />
  </div>

  <div class="font-option font-option-number">
    <label for="text-align">Alignment</label>
    <select id="text-align"></select>
  </div>

  <div class="font-option font-option-number">
    <label for="letter-spacing">Letter Spacing</label>
    <input
      id="letter-spacing"
      name="letter-spacing"
      type="number"
      placeholder="em"
      step="0.01"
    />
  </div>
</div>

<div>
  <label for="text">Text Input</label>
  <textarea type="text" name="text" id="text"></textarea>
</div>
`

export default template
