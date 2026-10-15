const formulario = document.getElementById('formulario');
// Referências aos elementos da página
const nome = document.getElementById('name');
const botao = document.getElementById('buscar');
const mensagem = document.getElementById('mensagem');
const resultado = document.getElementById('resultado');

formulario.addEventListener('submit', function(evento) {
    // Impede o envio padrão do formulário (recarregar a página)
    evento.preventDefault();

    // Remove espaços extras e valida o texto digitado
    const termo = nome.value.trim();
    if (termo === '') {
        alert('Por favor, digite um nome de localidade válido.');
        return;
    }

    // Limpa resultados anteriores e evita cliques repetidos durante a busca
    resultado.textContent = '';
    mensagem.textContent = 'Buscando localidades...';
    botao.disabled = true;

    // Monta os parâmetros da consulta (o URLSearchParams codifica o nome corretamente)
    const parametros = new URLSearchParams({
        name: termo,
        count: 10,
        language: 'pt',
        format: 'json'
    });

    // Envia a requisição GET para a API de geocodificação
    fetch(`https://geocoding-api.open-meteo.com/v1/search?${parametros}`)
        .then(function(resposta) {
            // O fetch não rejeita erros HTTP automaticamente
            if (!resposta.ok) {
                throw new Error(`Erro HTTP: ${resposta.status}`);
            }
            return resposta.json();
        })
        .then(function(dados) {
            // Sem ocorrências, a API omite "results"; usamos lista vazia
            const locais = dados.results || [];
            console.log(dados);

            mensagem.textContent = locais.length === 0
                ? 'Nenhuma localidade encontrada.'
                : `${locais.length} ocorrências encontradas.`;

            // Cria um item da lista para cada ocorrência
            locais.forEach(function(local) {
                const item = document.createElement('li');
                // filter(Boolean) descarta campos ausentes (undefined)
                const partes = [local.name, local.admin2, local.admin1, local.country].filter(Boolean);
                item.textContent = `${partes.join(', ')} (lat: ${local.latitude}, lon: ${local.longitude})`;
                resultado.appendChild(item);
            });
        })
        .catch(function(erro) {
            mensagem.textContent = 'Não foi possível buscar os dados.';
            console.error(erro);
        })
        // Executa sempre, com sucesso ou erro: reabilita o botão
        .finally(function() {
            botao.disabled = false;
        });
});