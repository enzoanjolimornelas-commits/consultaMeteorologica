const formulario = document.getElementById('busca');
const pesquisa = document.getElementById('pesquisa');
const botao = document.getElementById('botao');
const feedback = document.getElementById('feedback');
const resultados = document.getElementById('lista');
const divClima = document.getElementById('clima');
const hoje = document.getElementById('hoje');
const proxDias = document.getElementById('proximos-dias');
const listaFavoritos = document.getElementById('favoritos');

const cidadesFavoritas = [];

const descricoesClima = {
			0: 'Céu limpo',
			1: 'Predominantemente limpo',
			2: 'Parcialmente nublado',
			3: 'Nublado',
			45: 'Nevoeiro',
			48: 'Nevoeiro com geada',
			51: 'Garoa leve',
			53: 'Garoa moderada',
			55: 'Garoa intensa',
			56: 'Garoa congelante leve',
			57: 'Garoa congelante intensa',
			61: 'Chuva fraca',
			63: 'Chuva moderada',
			65: 'Chuva forte',
			66: 'Chuva congelante leve',
			67: 'Chuva congelante forte',
			71: 'Neve fraca',
			73: 'Neve moderada',
			75: 'Neve forte',
			77: 'Grãos de neve',
			80: 'Pancadas de chuva fracas',
			81: 'Pancadas de chuva moderadas',
			82: 'Pancadas de chuva violentas',
			85: 'Pancadas de neve fracas',
			86: 'Pancadas de neve fortes',
			95: 'Tempestade',
			96: 'Tempestade com granizo leve',
			99: 'Tempestade com granizo forte'
};

function salvarNoLocalStorage() {
    localStorage.setItem("minhasCidades", JSON.stringify(cidadesFavoritas));
}

function carregarDoLocalStorage() {
    const cidadesSalvas = localStorage.getItem("minhasCidades");
    if (cidadesSalvas) {
        const dados = JSON.parse(cidadesSalvas);
        cidadesFavoritas.push(...dados);
    }
}

async function buscarLocalidades(local) {
    feedback.innerHTML = '';

    if(local === '') {
        feedback.innerHTML = `<p>Por favor, digite um nome de localidade válido.</p>`;
        return;
    }

    resultados.innerHTML = '';
    feedback.innerHTML = '<p>Buscando localidades...</p>';
    botao.disabled = true;

    const parametros = new URLSearchParams({
				name: local,
				count: 50,
				language: 'pt',
				format: 'json'
	});

    await fetch(`https://geocoding-api.open-meteo.com/v1/search?${parametros}`)
				.then(function(resposta) {
					if (!resposta.ok) {
						throw new Error(`Erro HTTP: ${resposta.status}`);
					}
					return resposta.json();
				})
				.then(function(dados) {
					const locais = dados.results || [];
					console.log(dados);

					feedback.innerHTML = locais.length === 0
						? '<p>Nenhuma localidade encontrada.</p>'
						: `<p>${locais.length} ocorrências encontradas.</p>`;

					locais.forEach(function(local) {
						const item = document.createElement('li');
						const partes = [local.name, local.admin2, local.admin1, local.country].filter(Boolean);
						item.textContent = `${partes.join(', ')} (lat: ${local.latitude}, lon: ${local.longitude})`;
                        item.addEventListener('click', function(event){
                            event.preventDefault();

                            consultarClima(local.latitude, local.longitude, local.name, local.country)
                        })
						resultados.appendChild(item);
					});
				})
				.catch(function(erro) {
					feedback.innerHTML = '<p>Não foi possível buscar os dados.</p>';
					console.error(erro);
				})
				.finally(function() {
					botao.disabled = false;
				});
}

async function consultarClima(lat, lon, nomeCidade, pais) {
    feedback.innerHTML = '<p>Buscando clima...</p>';
    hoje.innerHTML = '';
    proxDias.innerHTML = '';

    const parametros = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
        timezone: 'auto'
    });

    try {
        const resposta = await fetch('https://api.open-meteo.com/v1/forecast?' + parametros);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const dados = await resposta.json();

        feedback.innerHTML = '';

        let descricao = descricoesClima[dados.current.weather_code] || 'Condição desconhecida';

        const estaFavorito = cidadesFavoritas.some(cidade => cidade.lat === lat && cidade.lon === lon);
		const iconeInicial = estaFavorito 
			? 'sistema/img/estrelaCheia.jpeg' 
			: 'sistema/img/estrela.png';

		const localFormatado = pais ? `${nomeCidade}, ${pais}` : nomeCidade;

		hoje.innerHTML = `
			<h2>Previsão do tempo para hoje em ${localFormatado}</h2>
			<img src='${iconeInicial}' alt='Ícone de estrela para favoritar' id='estrela' style='cursor: pointer; width: 1.1em;'>
			<div>${descricao}</div>
			<div>
				<div>Temperatura: ${dados.current.temperature_2m}°C</div>
				<div>Sensação Térmica: ${dados.current.apparent_temperature}°C</div>
				<div>Humidade Relativa: ${dados.current.relative_humidity_2m}%</div>
				<div>Velocidade do Vento: ${dados.current.wind_speed_10m}km/h</div>
			</div>
		`;

		const estrela = document.getElementById('estrela');

		estrela.addEventListener('click', () => {
			const indice = cidadesFavoritas.findIndex(cidade => cidade.lat === lat && cidade.lon === lon);

			if (indice !== -1) {
				cidadesFavoritas.splice(indice, 1);
				salvarNoLocalStorage();
				estrela.src = 'sistema/img/estrela.png';
			} else {
				cidadesFavoritas.push({ nome: nomeCidade, pais: pais, lat: lat, lon: lon });
				salvarNoLocalStorage();
				estrela.src = 'sistema/img/estrelaCheia.jpeg';
			}

			renderizarFavoritos();
		});

        proxDias.innerHTML = `<h2>Próximos 5 dias</h2>`;

        for (let i = 1; i <= 5; i++) {
			descricao = descricoesClima[dados.daily.weather_code[i]] || 'Condição desconhecida';

			const precipitacao = dados.daily.precipitation_probability_max?.[i];
			const textoPrecipitacao = (precipitacao !== null && precipitacao !== undefined)
				? `${precipitacao}%`
				: 'Não informada';

			const dataObj = new Date(dados.daily.time[i] + 'T00:00:00');
			const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
			const diaFormatado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
			const dataCurta = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

			proxDias.innerHTML += `
				<div>
					<p><strong>${diaFormatado}</strong> (${dataCurta})</p>
					<div>De ${dados.daily.temperature_2m_min[i]}°C a ${dados.daily.temperature_2m_max[i]}°C</div>
					<div>Probabilidade de precipitação: ${textoPrecipitacao}</div>
					<div>${descricao}</div>
				</div>
			`;
		}
    } catch (erro) {
        feedback.innerHTML = `<p>Erro: ${erro.message || erro}</p>`;
    }
}

function renderizarFavoritos(){

	listaFavoritos.innerHTML = '';

	const tituloFavoritos = document.createElement("h2");

	tituloFavoritos.textContent = 'Favoritos';

	if(cidadesFavoritas.length !== 0) {
		listaFavoritos.appendChild(tituloFavoritos);
	}

	cidadesFavoritas.forEach((cidade, indice) => {

		const favorito = document.createElement("li");
		favorito.textContent = `${cidade.nome}`;
		favorito.style.display = 'inline';

		const excluir = document.createElement("img");
		excluir.src = 'sistema/img/excluir.png';
		excluir.style.display = 'inline';

		favorito.appendChild(excluir);
		listaFavoritos.appendChild(favorito);

		favorito.addEventListener('click', () => {
			consultarClima(cidade.lat, cidade.lon, cidade.nome, cidade.pais);
		});

		excluir.addEventListener("click", (event) => {
			event.stopPropagation();

			cidadesFavoritas.splice(indice, 1);
			salvarNoLocalStorage();
			renderizarFavoritos();

			const estrela = document.getElementById('estrela');
			const tituloHoje = hoje.querySelector('h2');
			if (estrela && tituloHoje && tituloHoje.textContent.includes(cidade.nome)) {
				estrela.src = 'sistema/img/estrela.png';
			}
		});
	});
}

formulario.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const local = pesquisa.value.trim();

    buscarLocalidades(local);
});

document.addEventListener("DOMContentLoaded", () => {
	carregarDoLocalStorage();
	renderizarFavoritos();
});