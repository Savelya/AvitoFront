// Переменная хранящая позицию следующего выводимого продукта
let currentProductPos = 0;

// Объекты с продуктами
let productList;         	// Объект который мы выводим
let originalProductList;	// Объект полученный изначально и не изменённый
let productFavorite = [];	// Объкт с избранными продуктами (массив id избранных продуктов)

//  Объект инфо продавцов
let sellerList;

// Функция вывода товара
function viewProductAvito(){
	// переменная для проверки является ли продукт избранным
	let checked = "";
	// переменная для проверки существования цены у товара
	let price = "";

	// выводим список продуктов по 10шт
	for(let i = currentProductPos; i < currentProductPos + 10; i++){

		// проверяем существование продукта
		if(productList[i] !== undefined){

			// проверка на избранность
			if (productFavorite.indexOf(Number(productList[i].id)) !== -1){
				checked = "checked";
			} else {
				checked = "";
			}

			// проверка существования цены у товара
			if (productList[i].price !== undefined){
				price = String(productList[i].price).replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ') + " ₽";
			} else {
				price = "Цена не указана";
			}

			// выводимый блок одного продукта
			let block = 
				"<div class='product'><div class='product-photo'><img src='" + productList[i].pictures[0] + 
				// количество всех фотографий как на сайте avito если только дополнительных то -1
				"' height='200' width=='200' alt=''><p class='product-photos-quantity'>" + productList[i].pictures.length + "</p></div>" + 
				"<div class='product-text'><h3 class='product-title'>" + productList[i].title + "</h3>" +
				"<p class='product-price'>" + price + "</p>" +
				"<div class='product-seller'>" + productList[i].relationships.seller.name + "</br>" +
				"Рейтинг: " + productList[i].relationships.seller.rating + "</div>" +
				"<div class='product-favorite'><input type='checkbox' id='input-favorite" +
				 productList[i].id + "' onclick='addFavorite(checked," +
				 productList[i].id + ")'" + checked + "/>" +
				"<label title='Добавить в избранное' for='input-favorite" +
				 productList[i].id + "'></label></div></div></div>";

			// вывод блока продукта
			$('.content').append(block);
		}
	}
	

	// запоминаем текущую позициию списка продуктов
	currentProductPos += 10;
}

// Функция получения товаров
function getProductAvito(){
	// запрос к API
	$.ajax({
		url: "https://avito.dump.academy/products",
		dataType: 'json',
		success: (data) => {
			// получаем данные о продуктах
			productList = data.data;
			// получаем информацию о продавцах
			getSellerAvito();
		}
	});	
}

// Функция получения списка продавцов
function getSellerAvito(){
	// запрос к API
	$.ajax({
		url: "https://avito.dump.academy/sellers",
		dataType: 'json',
		success: (data) => {
			sellerList = data.data;
			// сопоставляем данные
			for(let i = 0; i < Object.keys(productList).length ; i ++){
				productList[i].relationships.seller = sellerList.find((x) => { return x.id === productList[i].relationships.seller});
			}
			originalProductList = productList;
			// выводим продукты
			refreshContent();

		}
	});	
}

// Функция обновления блока контента
function refreshContent(){
	// очищаем результаты поиска
	$(".content").empty();
	
	// обнуляем стартовую позицию
	currentProductPos = 0;

	// выводим отфильтрвоаные товары
	viewProductAvito();
}

// Функция фильтрации товара
function filterProducts(){
	let low_price = $("#low-price").val();
	let higt_price = $("#high-price").val();
	let category = $("#category").val();

	// фильтр по цене
	productList = originalProductList.filter(x => { return (x.price <= higt_price && x.price >= low_price)});

	// фильтр по категории
	if(category!==''){
		productList = productList.filter(x => { return (x.category === category)});
	}

	// обновдение контента
	refreshContent();
}

// Функция фильтрации по избранному
function filterFavorite(){
	// фильтр по избраному
	productList = originalProductList.filter(x => { return (productFavorite.indexOf(Number(x.id)) !== -1)});
	// обновление контента
	refreshContent();
}

// Функция сортировки по цене
function sortPrice(value){
	// убираем товары без цены
	productList = productList.filter(x => { return (x.price !== undefined)});

	// направление сортировки
	if(value == 0) {
		productList = productList.sort((a,b) => {
			return a.price - b.price;
		});
		$("#sort-price").val('1');
		$("#sort-price").text('Сортировать по убыванию цены');
	} else {
		productList = productList.sort((a,b) => {
			return b.price - a.price;
		});
		$("#sort-price").val('0');
		$("#sort-price").text('Сортировать по возрастанию цены');

	}

	// обновление контента
	refreshContent();
}

// Функция сортировки по популярным товаром(как в ответе сервера отсортированно по id)
function sortPopular(){
	// сортировка по id
	productList = productList.sort((a,b) => {
			return Number(a.id) - Number(b.id);
	});

	$("#sort-price").val('0');
	$("#sort-price").text('Сортировать по возрастанию цены');

	// обновление контента
	refreshContent();
}


// Добавляем товар в избраное
function addFavorite(checked, id){
	// добавляем или удаляем продукт из избранного
	if(checked){
		productFavorite.push(id);

	}else{
		productFavorite.splice(productFavorite.findIndex(el => {return el === id}), 1);
	}
	// записываем в cookie
	document.cookie = "favorite=" + JSON.stringify(productFavorite);
}


//  Загружаем список избранного из cookie
let matches = document.cookie.match(new RegExp(
	"(?:^|; )" + "favorite".replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
));

if(matches){
	productFavorite = JSON.parse(matches[1]);
}

// Загружаем список товаров
getProductAvito();

// Событие прокрутки. При прокрутке до конца страницы загружаются следующие товары 
window.onscroll = () => {
	if($(window).scrollTop()+$(window).height()>=$(document).height() && currentProductPos <= productList.length){
    	viewProductAvito(productList);
	}
}
