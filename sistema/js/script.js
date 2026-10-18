const formulario = document.getElementById('busca');
const pesquisa = document.getElementById('pesquisa');
const botao = document.getElementById('botao');
const feedback = document.getElementById('feedback');
const resultados = document.getElementById('lista');
const divClima = document.getElementById('clima');
const hoje = document.getElementById('hoje');
const proxDias = document.getElementById('proximos-dias');

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

                            consultarClima(local.lattude, local.longitude, local.name)
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

async function consultarClima(lat, lon, nomeCidade) {
    feedback.innerHTML = "<p>Buscando clima...</p>";

}

formulario.addEventListener('submit', function(evento) {
    evento.preventDefault();

    const local = pesquisa.value.trim();

    buscarLocalidades(local);
});