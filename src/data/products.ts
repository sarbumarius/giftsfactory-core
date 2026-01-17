export interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  dimensions: string;
  image: string;
  badge?: 'bestseller' | 'popular' | 'new';
}

export const products: Product[] = [
  { id: 1, name: "Trofeu personalizat - Felicitari nou nascut", price: 120, rating: 5, dimensions: "21.5 × 18.5 cm", image: "/product-image.jpg", badge: "bestseller" },
  { id: 2, name: "Trofeu personalizat printat - fetita (data)", price: 135, rating: 5, dimensions: "25 × 21 cm", image: "/product-image.jpg", badge: "popular" },
  { id: 3, name: "Rama foto personalizata - Vreti sa fiti nasii mei", price: 110, rating: 5, dimensions: "22 × 15 cm", image: "/product-image.jpg" },
  { id: 4, name: "Trofeu Personalizat - Multumire Nas Botez", price: 120, rating: 5, dimensions: "22 × 18 cm", image: "/product-image.jpg" },
  { id: 5, name: "Cadou personalizat pentru nasi - Amintiri", price: 95, rating: 4, dimensions: "20 × 15 cm", image: "/product-image.jpg", badge: "new" },
  { id: 6, name: "Trofeu lemn gravat - Pentru cei mai buni nasi", price: 145, rating: 5, dimensions: "25 × 20 cm", image: "/product-image.jpg", badge: "bestseller" },
  { id: 7, name: "Rama foto cu mesaj - Multumim nasi", price: 105, rating: 5, dimensions: "18 × 13 cm", image: "/product-image.jpg" },
  { id: 8, name: "Trofeu cristal personalizat - Botez", price: 165, rating: 5, dimensions: "15 × 12 cm", image: "/product-image.jpg", badge: "popular" },
  { id: 9, name: "Cadou personalizat - Cei mai frumosi nasi", price: 115, rating: 4, dimensions: "22 × 17 cm", image: "/product-image.jpg" },
  { id: 10, name: "Placheta lemn - Amintire botez", price: 98, rating: 5, dimensions: "20 × 15 cm", image: "/product-image.jpg" },
  { id: 11, name: "Trofeu personalizat cu poza - Nasi botez", price: 130, rating: 5, dimensions: "24 × 18 cm", image: "/product-image.jpg", badge: "bestseller" },
  { id: 12, name: "Rama decorativa - Multumire nasi", price: 89, rating: 4, dimensions: "18 × 14 cm", image: "/product-image.jpg" },
  { id: 13, name: "Cadou gravat - Pentru nasii nostri", price: 142, rating: 5, dimensions: "23 × 19 cm", image: "/product-image.jpg", badge: "new" },
  { id: 14, name: "Trofeu acril personalizat - Botez special", price: 155, rating: 5, dimensions: "20 × 16 cm", image: "/product-image.jpg" },
  { id: 15, name: "Placheta personalizata - Cei mai buni nasi", price: 108, rating: 4, dimensions: "21 × 16 cm", image: "/product-image.jpg" },
  { id: 16, name: "Rama foto eleganta - Amintiri botez", price: 125, rating: 5, dimensions: "25 × 20 cm", image: "/product-image.jpg", badge: "popular" },
  { id: 17, name: "Trofeu lemn natural - Multumire", price: 118, rating: 5, dimensions: "22 × 17 cm", image: "/product-image.jpg" },
  { id: 18, name: "Cadou personalizat premium - Nasi", price: 175, rating: 5, dimensions: "28 × 22 cm", image: "/product-image.jpg", badge: "bestseller" },
  { id: 19, name: "Rama vintage personalizata - Botez", price: 95, rating: 4, dimensions: "19 × 14 cm", image: "/product-image.jpg" },
  { id: 20, name: "Trofeu cu led - Pentru nasi speciali", price: 185, rating: 5, dimensions: "24 × 20 cm", image: "/product-image.jpg", badge: "new" },
  { id: 21, name: "Placheta cristal - Amintire pentru nasi", price: 160, rating: 5, dimensions: "18 × 15 cm", image: "/product-image.jpg" },
  { id: 22, name: "Cadou personalizat rustic - Botez", price: 112, rating: 4, dimensions: "20 × 16 cm", image: "/product-image.jpg" },
  { id: 23, name: "Trofeu elegant - Cei mai buni nasi", price: 148, rating: 5, dimensions: "23 × 18 cm", image: "/product-image.jpg", badge: "popular" },
  { id: 24, name: "Rama foto moderna - Multumire nasi", price: 102, rating: 5, dimensions: "21 × 16 cm", image: "/product-image.jpg" },
  { id: 25, name: "Cadou gravat manual - Pentru nasi", price: 195, rating: 5, dimensions: "26 × 21 cm", image: "/product-image.jpg", badge: "bestseller" },
  { id: 26, name: "Trofeu personalizat minimalist", price: 135, rating: 4, dimensions: "22 × 17 cm", image: "/product-image.jpg" },
  { id: 27, name: "Placheta lemn vintage - Botez", price: 88, rating: 5, dimensions: "18 × 13 cm", image: "/product-image.jpg" },
  { id: 28, name: "Cadou premium cu poza - Nasi", price: 168, rating: 5, dimensions: "25 × 20 cm", image: "/product-image.jpg", badge: "new" },
  { id: 29, name: "Trofeu acril transparent - Multumire", price: 142, rating: 4, dimensions: "20 × 16 cm", image: "/product-image.jpg" },
  { id: 30, name: "Rama personalizata delux - Botez", price: 128, rating: 5, dimensions: "24 × 19 cm", image: "/product-image.jpg" },
  { id: 31, name: "Cadou unic personalizat - Nasi botez", price: 156, rating: 5, dimensions: "23 × 18 cm", image: "/product-image.jpg", badge: "popular" },
  { id: 32, name: "Trofeu lemn sculptat - Amintire", price: 178, rating: 5, dimensions: "27 × 22 cm", image: "/product-image.jpg" },
  { id: 33, name: "Placheta eleganta - Pentru nasi", price: 115, rating: 4, dimensions: "21 × 16 cm", image: "/product-image.jpg" },
  { id: 34, name: "Rama foto artistica - Botez", price: 132, rating: 5, dimensions: "22 × 18 cm", image: "/product-image.jpg", badge: "bestseller" },
  { id: 35, name: "Cadou personalizat artistic - Nasi", price: 145, rating: 5, dimensions: "24 × 19 cm", image: "/product-image.jpg" },
  { id: 36, name: "Trofeu modern cu led - Multumire", price: 192, rating: 5, dimensions: "25 × 20 cm", image: "/product-image.jpg", badge: "new" },
  { id: 37, name: "Placheta acril personalizata - Botez", price: 125, rating: 4, dimensions: "20 × 15 cm", image: "/product-image.jpg" },
  { id: 38, name: "Cadou exclusiv - Cei mai buni nasi", price: 210, rating: 5, dimensions: "28 × 23 cm", image: "/product-image.jpg", badge: "popular" },
  { id: 39, name: "Trofeu clasic personalizat - Nasi", price: 138, rating: 5, dimensions: "23 × 18 cm", image: "/product-image.jpg" },
  { id: 40, name: "Rama lemn natural - Amintiri botez", price: 98, rating: 4, dimensions: "19 × 14 cm", image: "/product-image.jpg" },
];

export const categories = [
  { id: 1, name: "Meniu", icon: "Menu" },
  { id: 2, name: "Trofee", icon: "Trophy" },
  { id: 3, name: "Leduri", icon: "Lightbulb" },
  { id: 4, name: "Rame", icon: "Frame" },
  { id: 5, name: "Licheni", icon: "Leaf" },
  { id: 6, name: "Cadouri", icon: "Gift" },
];

export const categoryCards = [
  { id: 1, title: "Cerere nasi botez", count: 9 },
  { id: 2, title: "#Mosi de botez", count: 11 },
  { id: 3, title: "Cadouri pentru nasi", count: 15 },
  { id: 4, title: "Marturii botez", count: 8 },
  { id: 5, title: "Invitatii botez", count: 12 },
];

export const faqItems = [
  { question: "Vreau sa plasez o comanda cu produse personalizate. Care sunt pasii?", answer: "Pentru a plasa o comanda, selectati produsul dorit, personalizati-l cu textul si imaginile preferate, apoi adaugati-l in cos si finalizati comanda." },
  { question: "Se poate personaliza produsul cu textul meu?", answer: "Da, toate produsele noastre pot fi personalizate cu textul dumneavoastra. Aveti campuri speciale pentru a introduce mesajul dorit." },
  { question: "Ce metode de plata pot avea?", answer: "Acceptam plata cu cardul, transfer bancar, ramburs la curier sau plata in rate prin partenerii nostri." },
  { question: "Pot comanda telefonic?", answer: "Da, puteti comanda telefonic la numarul 0748.77.77.77, de luni pana vineri, intre orele 10:00-18:00." },
  { question: "In cat timp ajunge o comanda?", answer: "Comenzile sunt procesate in 2-5 zile lucratoare, iar livrarea dureaza inca 1-3 zile lucratoare." },
  { question: "Care este costul transportului?", answer: "Transportul este gratuit pentru comenzile peste 200 lei. Pentru comenzi sub aceasta valoare, costul este de 20 lei." },
];
