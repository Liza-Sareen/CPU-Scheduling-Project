const grid = document.getElementById('card-grid');

// Function to render cards
healthModules.forEach(module => {
    const cardHtml = `
        <div class="card">
            <div class="card-image" style="background-image: url('${module.img}')"></div>
            <div class="card-content">${module.title}</div>
        </div>
    `;
    grid.innerHTML += cardHtml;
});
