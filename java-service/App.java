import com.sun.net.httpserver.*;
import java.io.*;
import java.net.InetSocketAddress;
import java.util.*;
import java.util.stream.Collectors;
import com.google.gson.*;

public class App {
    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/analyze", new AnalyzeHandler());
        server.setExecutor(null);
        System.out.println("Java service on http://localhost:8080");
        server.start();
    }
}

class AnalyzeHandler implements HttpHandler {
    private static final Set<String> stopwords = Set.of("el", "la", "los", "y", "de", "que", "en", "a", "un", "una",
            "es");

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (!"POST".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(405, -1);
            return;
        }

        InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), "utf-8");
        JsonObject body = JsonParser.parseReader(isr).getAsJsonObject();
        String texto = body.get("texto").getAsString().toLowerCase();

        String sentimiento = analizarSentimiento(texto);
        List<String> keywords = extraerPalabrasClave(texto);

        JsonObject respuesta = new JsonObject();
        respuesta.addProperty("sentimiento", sentimiento);

        JsonArray arr = new JsonArray();
        for (String kw : keywords)
            arr.add(kw);
        respuesta.add("palabrasClave", arr);

        byte[] responseBytes = new Gson().toJson(respuesta).getBytes("UTF-8");
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, responseBytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(responseBytes);
        os.close();
    }

    private String analizarSentimiento(String texto) {
        String[] positivas = { "feliz", "alegre", "excelente", "maravilloso", "bueno" };
        String[] negativas = { "triste", "horrible", "malo", "terrible", "aburrido" };

        int score = 0;
        for (String palabra : texto.split("\\s+")) {
            if (Arrays.asList(positivas).contains(palabra))
                score++;
            if (Arrays.asList(negativas).contains(palabra))
                score--;
        }

        return score > 0 ? "positivo" : score < 0 ? "negativo" : "neutral";
    }

    private List<String> extraerPalabrasClave(String texto) {
        Map<String, Integer> frecuencia = new HashMap<>();
        for (String palabra : texto.split("\\s+")) {
            if (stopwords.contains(palabra) || palabra.length() < 3)
                continue;
            frecuencia.put(palabra, frecuencia.getOrDefault(palabra, 0) + 1);
        }

        return frecuencia.entrySet().stream()
                .sorted((a, b) -> b.getValue() - a.getValue())
                .limit(5)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }
}
