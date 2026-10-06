-- ============================================================
-- Batch 10: Stanford CS224n (NLP) + Stanford CS231n (Deep Learning)
-- ============================================================

-- ============================================================
-- NATURAL LANGUAGE PROCESSING (Stanford CS224n) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('nlp', 1, 'Introduction to NLP and Word Vectors', $LEC$
## What is Natural Language Processing?

NLP is the field of AI that deals with understanding and generating human language. It spans:

- **Syntax:** structure of sentences (parsing, part-of-speech tagging)
- **Semantics:** meaning of words and sentences
- **Pragmatics:** meaning in context (dialogue, implicature)
- **Applications:** translation, summarization, question answering, sentiment analysis, chatbots

NLP is hard because language is ambiguous, context-dependent, and continually evolving.

## Why is Language Hard for Computers?

Consider: "I saw the man with the telescope."

Two meanings:
1. I used a telescope to see the man.
2. I saw a man who had a telescope.

The same words, different syntactic structures, different meanings.

Add pragmatics: "Can you pass the salt?" is a request, not a question. Sarcasm, idioms, cultural references make it even harder.

## Classical NLP vs Neural NLP

**Classical (pre-2013):** hand-crafted features, statistical models (HMMs, CRFs, SVMs). Rule-based systems.

**Neural (2013+):** word embeddings, RNNs, then transformers. Learned representations end-to-end.

The shift happened because neural methods scaled with data and compute.

## Word Representations

How do we represent a word as a vector?

**One-hot:** vector of size |V|, one 1 for the word, rest 0s. Simple, but:
- No notion of similarity
- Huge vectors (|V| = 50,000+)
- No generalization

**Word embeddings:** dense, low-dimensional vectors (50-300 dims) where similar words are close.

## Word2Vec

Mikolov et al. (2013) introduced Word2Vec. Two variants:

**Skip-gram:** predict context words from center word.

    P(w_{t+j} | w_t) for j = -m..m

**CBOW:** predict center word from context.

Both train a neural network on a large corpus. The learned weights become the embeddings.

## The Skip-gram Objective

Maximize the log probability of context words given center words:

    J(θ) = (1/T) Σ_t Σ_{j=-m, j≠0}^m log P(w_{t+j} | w_t; θ)

Where P uses softmax:

    P(o | c) = exp(u_o^T v_c) / Σ_w exp(u_w^T v_c)

Softmax over the entire vocabulary is expensive. Solutions:
- **Negative sampling:** sample a few "negative" words, train binary classifier
- **Hierarchical softmax:** tree-structured computation

## Properties of Word2Vec Embeddings

Learned embeddings capture semantic relationships:

    king - man + woman ≈ queen
    Paris - France + Italy ≈ Rome
    walking - walk + swim ≈ swimming

Analogies work in the embedding space. This surprised everyone.

## GloVe

Global Vectors (Pennington et al., 2014). Combines:
- Global matrix factorization (like LSA)
- Local context windows (like Word2Vec)

Factorizes the co-occurrence matrix directly. Often works as well as Word2Vec.

## FastText

Facebook's extension. Represents words as bags of character n-grams.

Benefits:
- Handles out-of-vocabulary words (morphology)
- Better for morphologically rich languages
- Robust to typos

## Contextual Embeddings

Word2Vec and GloVe give **one vector per word**, regardless of context. But "bank" means different things in "river bank" and "bank account".

**ELMo (2018):** bidirectional LSTM, context-dependent embeddings. First big win.

**BERT (2018):** transformer-based, deep bidirectional. State-of-the-art on many tasks.

**GPT (2018+):** transformer decoder, generative. Powers ChatGPT.

Contextual embeddings replaced static ones almost entirely.

## Subword Tokenization

Modern NLP uses subword units (BPE, WordPiece, SentencePiece) instead of whole words.

Benefits:
- Fixed vocabulary size
- Handles rare words
- Language-agnostic

"unhappiness" → "un", "happi", "ness"

This is what GPT/BERT use.

## Key Takeaways

- NLP spans syntax, semantics, pragmatics
- Language is ambiguous and context-dependent
- One-hot encoding is simple but weak
- Word2Vec/GloVe: static embeddings, capture analogies
- FastText: handles morphology
- Contextual embeddings (ELMo, BERT, GPT) are current standard
- Subword tokenization handles open vocabulary
$LEC$, 50),

('nlp', 2, 'Recurrent Neural Networks and Language Models', $LEC$
## Language Modeling

A language model assigns probabilities to sequences:

    P(w_1, w_2, ..., w_n) = P(w_1) × P(w_2 | w_1) × ... × P(w_n | w_1..w_{n-1})

Used for:
- Speech recognition (pick most likely transcript)
- Machine translation
- Text generation
- Autocomplete

## N-gram Models

Approximate P(w_n | w_1..w_{n-1}) ≈ P(w_n | w_{n-k}..w_{n-1}).

For bigrams (k=1), trigrams (k=2). Estimate from counts:

    P(w_n | w_{n-1}) = count(w_{n-1}, w_n) / count(w_{n-1})

Simple but:
- Sparse (many n-grams never seen)
- Curse of dimensionality (exponential in n)
- No generalization (can't relate similar contexts)

## Neural Language Models

Bengio et al. (2003): feed-forward NN with embeddings.

    Input: previous n-1 words (embeddings)
    Hidden: nonlinear transformation
    Output: softmax over vocabulary

Benefits: shared parameters across contexts, smooth probabilities.

## Recurrent Neural Networks

An RNN processes a sequence one element at a time, maintaining a hidden state.

    h_t = tanh(W_hh × h_{t-1} + W_xh × x_t + b_h)
    y_t = W_hy × h_t + b_y

The hidden state h_t summarizes everything seen so far.

Unrolled through time, an RNN shares weights across timesteps.

## RNN for Language Modeling

At each step t:
- Input: word embedding x_t
- Hidden: h_t
- Output: distribution over next word

    P(w_{t+1} | w_1..w_t) = softmax(W × h_t)

## Backpropagation Through Time (BPTT)

Train RNN by unrolling and backpropagating. Gradients flow from output at time t back through all earlier steps.

Problem: vanishing/exploding gradients.

- **Vanishing:** gradients shrink exponentially with sequence length. Network can't learn long-term dependencies.
- **Exploding:** gradients grow exponentially. Training diverges.

Solutions:
- **Gradient clipping:** cap gradient magnitude
- **Better activations:** ReLU helps
- **LSTM, GRU:** gated architectures

## LSTM (Long Short-Term Memory)

Hochreiter & Schmidhuber (1997). Introduces:
- **Cell state c_t:** long-term memory
- **Forget gate:** what to forget
- **Input gate:** what to add
- **Output gate:** what to output

Gate equations (simplified):

    f_t = σ(W_f [h_{t-1}, x_t])
    i_t = σ(W_i [h_{t-1}, x_t])
    o_t = σ(W_o [h_{t-1}, x_t])
    c_t = f_t ⊙ c_{t-1} + i_t ⊙ tanh(W_c [h_{t-1}, x_t])
    h_t = o_t ⊙ tanh(c_t)

Gates let the network learn to preserve or reset information. Solves vanishing gradient for long sequences.

## GRU (Gated Recurrent Unit)

Simpler than LSTM. Two gates:
- **Update gate:** combine forget and input
- **Reset gate:** how much past to forget

Fewer parameters, similar performance. Popular when compute-limited.

## Bidirectional RNNs

For tasks where the entire sequence is available (e.g., encoding), process forward and backward, concatenate hidden states.

    h_t = [h_t_forward; h_t_backward]

Captures context from both directions. Used in ELMo, BERT-style encoders.

## Sequence-to-Sequence Models

Sutskever et al. (2014). Encoder RNN → context vector → decoder RNN.

Encoder reads input, produces final hidden state.
Decoder generates output, conditioned on that state.

Applications: translation, summarization, dialogue.

Problem: bottleneck — the entire input compressed to one vector.

## Attention Mechanism

Bahdanau et al. (2014). Decoder can "look at" all encoder states, not just the final one.

At each decoder step, compute attention weights over encoder states:

    α_t = softmax(score(h_dec, h_enc))
    context = Σ α_t × h_enc

Decoder uses context plus its own state.

Revolutionized NLP. Now transformers use self-attention everywhere.

## Key Takeaways

- Language models predict next word
- N-gram models are simple but limited
- RNNs process sequences with shared weights
- Vanishing/exploding gradients are key issues
- LSTM, GRU solve long-term dependency
- Bidirectional for encoding tasks
- Seq2seq for translation
- Attention removes the bottleneck
$LEC$, 50),

('nlp', 3, 'Transformers and Attention', $LEC$
## The Transformer Revolution

Vaswani et al. (2017): "Attention Is All You Need." Replaced RNNs entirely. Now the standard for NLP, vision, speech, and more.

Key innovation: **self-attention** — every position attends to every other position in parallel.

Benefits:
- Parallelizable (no sequential recurrence)
- Captures long-range dependencies
- Scales to billions of parameters

## Self-Attention

Given input embeddings X (n × d), compute:

    Q = X W_Q    (queries)
    K = X W_K    (keys)
    V = X W_V    (values)

Attention:

    Attention(Q, K, V) = softmax(Q K^T / √d_k) V

Interpretation:
- Q K^T: similarity between each pair of positions
- Softmax: attention weights
- Multiply by V: weighted average of values

Every position gets a new representation that's a weighted sum of all positions.

## Why √d_k?

Without scaling, dot products grow with d_k, pushing softmax into saturation (near 0 or 1). Scaling by √d_k keeps them in a reasonable range.

## Multi-Head Attention

Instead of one attention operation, run h parallel "heads," each with its own W_Q, W_K, W_V.

    MultiHead = Concat(head_1, ..., head_h) W_O

Each head can focus on different relationships (syntactic, semantic, positional).

Typical h = 8 or 16.

## Positional Encoding

Self-attention is permutation-invariant — it doesn't know word order. Add positional information:

    PE(pos, 2i) = sin(pos / 10000^(2i/d))
    PE(pos, 2i+1) = cos(pos / 10000^(2i/d))

Or learnable position embeddings (BERT, GPT).

## The Transformer Block

Each layer:

1. Multi-head self-attention
2. Add & Norm (residual + layer norm)
3. Feed-forward (2 linear layers with ReLU)
4. Add & Norm

Stack N such blocks (6 in original, 12-96 in modern models).

## Encoder-Decoder Architecture

**Encoder:** stack of self-attention blocks. Each position attends to all positions.

**Decoder:** masked self-attention (each position attends only to earlier positions) + cross-attention to encoder outputs.

Used in translation (T5, BART).

## BERT (Bidirectional Encoder Representations)

Devlin et al. (2018). Encoder-only transformer.

Pre-trained with two tasks:
- **Masked language modeling (MLM):** predict randomly masked words
- **Next sentence prediction (NSP):** predict if two sentences are consecutive

Fine-tuned per task (classification, QA, NER).

BERT-Base: 12 layers, 110M params.
BERT-Large: 24 layers, 340M params.

## GPT (Generative Pre-trained Transformer)

OpenAI. Decoder-only transformer. Trained to predict the next token on massive text.

GPT-1 (2018): 117M params.
GPT-2 (2019): 1.5B.
GPT-3 (2020): 175B.
GPT-4 (2023): ~1.7T (estimated, MoE).

Zero-shot and few-shot learning via prompting.

## Scaling Laws

Kaplan et al. (2020): model performance follows a power law in compute, parameters, and data.

Chinchilla (2022): models were undertrained. Optimal: ~20 tokens per parameter.

Modern models train on trillions of tokens.

## Beyond NLP

Transformers now dominate:
- **Vision (ViT):** patches as tokens
- **Speech (Whisper):** spectrograms as tokens
- **Protein folding (AlphaFold):** amino acids as tokens
- **Reinforcement learning (Decision Transformer):** states as tokens

A single architecture for everything.

## Key Takeaways

- Transformers replaced RNNs entirely
- Self-attention: every position attends to every other
- Multi-head for diverse relationships
- Positional encoding for order
- BERT (encoder) for understanding
- GPT (decoder) for generation
- Scaling laws guide model size
- Transformers dominate NLP, vision, speech, biology
$LEC$, 50),

('nlp', 4, 'Pretraining, Fine-tuning, and Transfer Learning', $LEC$
## The Pretrain-Finetune Paradigm

Training large models from scratch is expensive. Instead:

1. **Pretrain** on massive unlabeled text (months of GPU time)
2. **Fine-tune** on task-specific data (hours-days)
3. **Deploy** on the target task

Transfer learning is now standard in NLP.

## Why Does Pretraining Work?

The model learns general language understanding:
- Syntax (grammatical structure)
- Semantics (word meanings)
- World knowledge (facts about the world)
- Reasoning patterns

This knowledge transfers to any downstream NLP task.

## Pretraining Objectives

**Causal LM (GPT):** predict next token.

    P(x_t | x_1, ..., x_{t-1})

**Masked LM (BERT):** predict masked tokens.

    P(x_masked | context)

**Span corruption (T5):** replace spans with sentinel tokens, predict them.

**Prefix LM (PaLM, UL2):** hybrid.

Each has different strengths.

## Fine-tuning

Add a task-specific head and train on labeled data:

    [CLS] The movie was great [SEP]
       ↓
    Encoder
       ↓
    [CLS] representation → classifier → positive

Small dataset: 1k-100k examples. Training: hours.

## Few-shot and Zero-shot Learning

Modern large LMs can perform tasks without fine-tuning:

**Zero-shot:** just a prompt.

    "Translate to French: Hello"

**Few-shot:** include a few examples in the prompt.

    "cat: chat. dog: chien. bird:"

GPT-3 popularized this. No gradient updates needed.

## Instruction Tuning

Fine-tune on (instruction, response) pairs:

    Instruction: "Summarize the following..."
    Response: "..."

Models like InstructGPT, FLAN-T5, Alpaca are instruction-tuned.

Result: models follow instructions much better.

## RLHF (Reinforcement Learning from Human Feedback)

Align model with human preferences:

1. **Supervised fine-tuning:** train on demonstrations
2. **Reward model:** learn to predict human preference
3. **RL (PPO):** optimize model to maximize reward

Used for ChatGPT, Claude, Gemini.

The reward model captures what humans want (helpful, harmless, honest).

## LoRA (Low-Rank Adaptation)

Fine-tuning large models is expensive. LoRA freezes the base model and adds small trainable matrices:

    W' = W + B × A

Where A and B are low-rank (rank 4-64). Only these are trained.

Benefits: 10,000x fewer parameters, similar performance, easy to swap.

QLoRA: quantized base + LoRA → fine-tune 65B on a single 48GB GPU.

## Prompt Engineering

Crafting prompts to get desired outputs:

- **Zero-shot:** "Classify sentiment: This product is amazing."
- **Chain-of-thought:** "Let's think step by step..."
- **Role prompting:** "You are a helpful assistant..."
- **Few-shot:** include examples
- **ReAct:** reason + act (for tool use)

Prompt engineering is now a skill, but its importance may fade as models improve.

## Adapters

Add small trainable modules between frozen layers. Alternative to LoRA.

Multi-task adapters: one adapter per task, switch at inference.

## Distillation

Train a small "student" model to mimic a large "teacher."

Student is faster, cheaper, sometimes nearly as good.

Examples:
- DistilBERT: 40% smaller, 60% faster, 97% of BERT performance
- TinyLlama, Phi-2: small but capable

## In-Context Learning

The model learns from examples in the prompt without parameter updates.

Emergent behavior: only appears in large models (>1B params).

Why it works is still debated — implicit gradient descent? Pattern matching?

## Retrieval-Augmented Generation (RAG)

Combine language model with a retrieval system:

1. Query a database for relevant documents
2. Feed documents + question into the LLM
3. LLM generates answer grounded in the documents

Benefits:
- Up-to-date knowledge (no retraining)
- Cite sources
- Reduce hallucination

Used in customer support, legal, medical.

## Key Takeaways

- Pretrain-finetune is standard
- Pretraining learns general language understanding
- Fine-tuning adapts to tasks
- Few-shot and zero-shot via prompting
- Instruction tuning improves following
- RLHF aligns with human preferences
- LoRA makes fine-tuning affordable
- Prompt engineering is a new skill
- Distillation compresses large models
- RAG combines retrieval with generation
$LEC$, 50),

('nlp', 5, 'Modern NLP Applications', $LEC$
## Machine Translation

Translate from source to target language.

Classical: rule-based → statistical (phrase-based) → neural (seq2seq).

**Neural MT:** encoder-decoder transformer. State-of-the-art since 2016.

Challenges:
- Low-resource languages (limited parallel data)
- Long documents (coherence)
- Idioms, cultural references
- Morphologically rich languages

Modern systems: Google Translate, DeepL, Meta NLLB.

## Question Answering

Given a question and context, produce an answer.

**Extractive:** select a span from context (BERT fine-tuned on SQuAD).

**Generative:** produce answer from scratch (GPT).

**Retrieval-based:** find answer in a knowledge base.

**Open-domain:** combine retrieval + reader (DPR, RAG).

Examples: ChatGPT, Google Search's "People also ask."

## Text Summarization

Condense long text into a shorter version.

**Extractive:** select important sentences.

**Abstractive:** generate new text (transformer seq2seq).

**Multi-document:** summarize many documents.

Evaluation: ROUGE (n-gram overlap), BERTScore (semantic similarity), human eval.

Challenges: factual consistency (hallucination), length control, style.

## Sentiment Analysis

Classify text as positive, negative, neutral. Or with fine-grained labels (1-5 stars).

Applications: product reviews, social media monitoring, customer feedback.

Simple with BERT fine-tuning. ~95% accuracy on standard benchmarks.

Beyond binary: aspect-based sentiment ("The food was great but the service was slow").

## Named Entity Recognition (NER)

Identify people, organizations, locations, dates, etc.

Classical: CRF, HMM.
Neural: BiLSTM-CRF, BERT.
Modern: LLM with prompting.

Standard datasets: CoNLL-2003, OntoNotes.

## Text Classification

Any task that assigns labels to text:
- Spam detection
- Topic classification
- Intent recognition (chatbots)
- Hate speech detection
- Fake news detection

BERT + softmax head is the standard approach.

## Dialogue Systems

**Task-oriented:** book flights, order food. Slot filling + intent.

**Open-domain:** chat about anything. GPT-based.

**Retrieval-based:** select response from a database.

**Generative:** produce response from scratch.

Modern: LLMs are open-domain dialogue systems.

## Information Extraction

Turn unstructured text into structured data:
- **Relation extraction:** (Obama, born_in, Hawaii)
- **Event extraction:** who, what, when, where
- **Coreference resolution:** "He" → "Obama"

Foundation for knowledge graphs.

## Text Generation

Generate coherent, fluent text:
- **Story generation:** given prompt, write story
- **Code generation:** given description, write code
- **Dialogue:** chatbot responses
- **Data-to-text:** describe a table in natural language

Modern: GPT-4, Claude, Gemini generate human-quality text.

## Ethics and Bias

NLP models learn from human text, which contains bias.

Issues:
- **Gender bias:** "doctor" → male, "nurse" → female
- **Racial bias:** sentiment differs by dialect
- **Political bias:** training data skews
- **Toxicity:** models generate harmful content

Mitigation: data filtering, debiasing techniques, RLHF, red-teaming.

## Evaluation

**BLEU:** n-gram overlap, machine translation.
**ROUGE:** n-gram overlap, summarization.
**METEOR:** synonyms and stemming.
**BERTScore:** semantic similarity via embeddings.
**Perplexity:** language model quality.
**Human eval:** gold standard, but expensive.

No metric is perfect. Multiple metrics + human eval is best.

## Deployment

Large models are expensive to serve:
- **Quantization:** 8-bit, 4-bit reduce memory
- **Distillation:** train smaller student
- **Pruning:** remove weights
- **Batching:** process multiple requests
- **Caching:** store frequent responses
- **Edge deployment:** small models on device

Trade-offs between latency, cost, and quality.

## Future Directions

- **Multimodal:** text + image + audio (GPT-4V, Gemini)
- **Agents:** LLMs that use tools, take actions
- **Long context:** million-token windows
- **Efficiency:** sparse models, MoE
- **Reasoning:** chain-of-thought, tree search
- **Alignment:** ensuring helpful, harmless, honest

Rapidly evolving field.

## Key Takeaways

- Translation, QA, summarization are mature
- NER, classification, sentiment standard
- Dialogue systems revolutionized by LLMs
- Text generation approaching human quality
- Bias and ethics are serious concerns
- Multiple evaluation metrics needed
- Deployment requires efficiency techniques
- Future: multimodal, agents, long context
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;


-- ============================================================
-- DEEP LEARNING FOR VISION (Stanford CS231n) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('deep-learning', 1, 'Introduction to Computer Vision and CNNs', $LEC$
## What is Computer Vision?

Making computers understand images and video. Tasks:
- **Classification:** "this is a cat"
- **Detection:** "there's a cat here" (bounding box)
- **Segmentation:** pixel-level labels
- **Pose estimation:** skeleton of a person
- **Depth estimation:** 3D structure
- **Optical flow:** motion between frames

CV has exploded with deep learning since 2012.

## Why Vision is Hard

An image is a 3D array (H × W × 3). For a 224×224 RGB image: 150,528 numbers.

Naive fully-connected layers would have ~150,000 inputs × thousands of hidden units = billions of parameters.

Images have structure:
- **Locality:** nearby pixels are related
- **Translation invariance:** a cat is a cat regardless of position
- **Hierarchical features:** edges → textures → parts → objects

CNNs exploit this structure.

## Convolutional Neural Networks

A CNN uses **convolutional layers** that slide small filters across the input.

For a 3×3 filter on a H × W × C input:
- Filter has 3×3×C weights
- Slides across all positions
- Produces a H' × W' × 1 feature map (one per filter)

Each filter detects a specific pattern (edge, corner, texture). Multiple filters → multiple feature maps.

## Properties of Convolution

**Local connectivity:** each output depends on a small input region.

**Weight sharing:** same filter across all positions.

**Translation equivariance:** shift input → shift output.

Parameter count: 3×3×C per filter. Much smaller than dense.

## Pooling

Downsample feature maps to reduce spatial size and add translation invariance.

**Max pooling:** take max in each 2×2 region.
**Average pooling:** take average.

Pooling has no learnable parameters. Reduces H and W by factor 2 (for 2×2).

## CNN Architecture

Typical pattern:

    [Conv → ReLU] × N → Pool → [Conv → ReLU] × M → Pool → ... → Flatten → FC → Softmax

Features get smaller spatially, deeper in channels. Final layers are fully connected.

## LeNet (1998)

Yann LeCun's classic for handwritten digit recognition.

- 2 conv layers
- 2 pooling layers
- 3 fully connected
- ~60,000 parameters

Trained on MNIST. Used in ATMs for check reading.

## AlexNet (2012)

The breakthrough. Won ImageNet 2012 by a huge margin.

- 5 conv layers, 3 FC layers
- 60M parameters
- ReLU instead of sigmoid
- Dropout for regularization
- Data augmentation
- Trained on 2 GPUs (GTX 580, 3GB each)

Started the deep learning revolution.

## VGG (2014)

Very deep networks using only 3×3 convolutions. VGG-16 has 16 layers.

Simple, uniform architecture. Popular for transfer learning.

Downside: 138M parameters, slow.

## ResNet (2015)

Deep residual networks. Introduced **skip connections**:

    y = F(x) + x

Where F is a few conv layers. The +x is the identity shortcut.

Benefits:
- Trains very deep networks (100-1000 layers)
- Solves vanishing gradient
- Won ImageNet 2015

ResNet-50 is a workhorse for vision tasks.

## Modern Architectures

- **Inception (GoogLeNet):** multi-scale filters
- **DenseNet:** dense connections between layers
- **EfficientNet:** scaled depth, width, resolution
- **MobileNet:** for mobile, depthwise separable convs
- **ViT:** vision transformer, patches as tokens
- **ConvNeXt:** modernized CNN, competitive with ViT

## Training CNNs

- **Loss:** cross-entropy for classification
- **Optimizer:** SGD with momentum, Adam, AdamW
- **Regularization:** dropout, weight decay, data augmentation
- **Learning rate:** step decay, cosine, warmup
- **Batch norm:** normalize activations per batch, speeds training

## Transfer Learning

Pretrain on ImageNet, fine-tune on your task.

- Freeze early layers (generic features)
- Fine-tune later layers (task-specific)
- Works with small datasets (100s of examples)

Standard practice for most CV tasks.

## Key Takeaways

- Images are 3D arrays; CNNs exploit locality
- Convolution: local, weight-shared, translation-equivariant
- Pooling: downsample, add invariance
- AlexNet (2012) started the revolution
- VGG, ResNet, Inception, EfficientNet, ViT
- Transfer learning standard
- Modern: transformers competing with CNNs
$LEC$, 50),

('deep-learning', 2, 'Training Neural Networks', $LEC$
## The Training Loop

For each batch:
1. Forward pass: compute predictions
2. Compute loss
3. Backward pass: compute gradients
4. Update weights

Repeat until convergence.

## Loss Functions

**Classification:** cross-entropy.

    L = -Σ y_i log(p_i)

**Regression:** MSE.

    L = (1/N) Σ (y_i - ŷ_i)²

**Object detection:** combined classification + localization.
**Segmentation:** per-pixel cross-entropy or Dice.

## Gradient Descent Variants

**Batch GD:** use all data per step. Accurate but slow.

**Stochastic GD (SGD):** one example per step. Noisy but fast.

**Mini-batch GD:** 32-256 examples per step. Standard.

**Momentum:** add velocity term.

    v = β v + ∇L
    θ = θ - α v

Helps escape local minima, faster convergence.

**Adam:** adaptive per-parameter learning rates. Combines momentum + RMSprop.

    m = β₁ m + (1-β₁) ∇L
    v = β₂ v + (1-β₂) (∇L)²
    θ = θ - α m / (√v + ε)

AdamW decouples weight decay from gradient update. Standard for transformers.

## Backpropagation

The chain rule applied to computational graphs. For each layer, compute gradient w.r.t. inputs and weights.

For a linear layer y = Wx:
- dL/dW = dL/dy × x^T
- dL/dx = W^T × dL/dy

Automatic differentiation (autograd) handles this in PyTorch, JAX, TensorFlow.

## Vanishing and Exploding Gradients

Deep networks suffer from unstable gradients:
- **Vanishing:** gradients shrink through layers, early layers barely update.
- **Exploding:** gradients blow up, training diverges.

Solutions:
- **ReLU activation:** no saturation in positive range.
- **Batch normalization:** normalizes each layer's inputs.
- **Residual connections:** skip connections provide gradient highway.
- **Careful initialization:** He, Xavier.

## Activation Functions

- **Sigmoid:** σ(x) = 1/(1+e^-x). Saturates; rarely used in hidden layers.
- **Tanh:** range [-1, 1]. Still saturates.
- **ReLU:** max(0, x). Simple, fast, standard.
- **Leaky ReLU:** small slope for x<0.
- **ELU, SELU:** smooth variants.
- **GELU:** used in BERT, GPT.
- **SiLU/Swish:** used in EfficientNet, modern nets.

ReLU is default unless there's a reason.

## Weight Initialization

Bad initialization → dead networks.

**Xavier/Glorot:** for tanh/sigmoid. Var = 2/(fan_in + fan_out).

**He:** for ReLU. Var = 2/fan_in.

Too small → activations vanish. Too large → explode.

## Batch Normalization

Normalize each mini-batch:

    x̂ = (x - mean) / √(var + ε)
    y = γ x̂ + β

γ, β are learned. Standard in CNNs.

Benefits: faster training, allows higher LR, less sensitive to init.

**Layer norm:** normalize across features. Used in transformers.

**Group norm, instance norm:** alternatives for small batch sizes.

## Regularization

**Dropout:** randomly zero activations during training. Forces redundancy.

**Weight decay (L2):** penalize large weights.

**Data augmentation:** random crops, flips, color jitter. Cheap and effective.

**Early stopping:** stop when validation loss increases.

**Label smoothing:** soft targets prevent overconfidence.

## Learning Rate Schedules

- **Step decay:** divide LR by 10 every N epochs.
- **Cosine annealing:** LR follows cosine curve.
- **Warmup:** start small, increase for a few epochs, then decay.
- **One-cycle:** fast increase then decrease.

Critical for good convergence.

## Hyperparameter Tuning

Key hyperparameters:
- Learning rate (most important)
- Batch size
- Weight decay
- Dropout rate
- Number of layers, hidden size
- Optimizer choice

Approach: random search > grid search. Bayesian optimization for expensive models.

## Debugging Training

**Loss not decreasing:** LR too low, wrong loss, bug in forward.
**Loss NaN:** LR too high, numerical instability.
**Overfitting:** regularization, more data, smaller model.
**Underfitting:** bigger model, train longer.

Sanity checks: overfit a small batch. Verify loss on trivial data.

## Key Takeaways

- Training loop: forward, loss, backward, update
- Many optimizers; Adam/AdamW standard
- Backprop via chain rule
- Vanishing/exploding gradients solved by ReLU, batchnorm, residuals
- ReLU standard activation
- He init for ReLU
- Batch norm speeds training
- Regularization: dropout, weight decay, augmentation
- Learning rate schedule matters
- Random search for hyperparameters
$LEC$, 50),

('deep-learning', 3, 'Object Detection and Segmentation', $LEC$
## From Classification to Detection

Classification: "this image contains a cat."
Detection: "there's a cat at (x, y, w, h)."

Detection is harder: multiple objects, varying sizes, occlusions.

## Two-Stage Detectors

**R-CNN (2014):** region proposals → CNN per region → classify. Slow.

**Fast R-CNN (2015):** single CNN pass, ROI pooling. Faster.

**Faster R-CNN (2015):** add Region Proposal Network (RPN). End-to-end.

Still two-stage, still relatively slow (~5-10 FPS).

Used when accuracy matters more than speed.

## One-Stage Detectors

**YOLO (2016):** divide image into grid, predict boxes + classes per cell. Fast.

**SSD (2016):** multi-scale feature maps for different object sizes.

**RetinaNet (2017):** focal loss to handle class imbalance.

**YOLOv5/v7/v8:** modern versions, fast and accurate.

**EfficientDet:** scaled, efficient.

One-stage is now standard for real-time detection.

## Anchor Boxes

Pre-defined boxes of various sizes and aspect ratios at each position.

Each detection predicts:
- Offset from nearest anchor
- Class probabilities
- Objectness score

Recent models (FCOS, CenterNet) are anchor-free.

## Non-Maximum Suppression (NMS)

Many overlapping boxes for the same object. NMS:
1. Sort boxes by score
2. Keep highest
3. Remove boxes with IoU > threshold
4. Repeat

IoU (Intersection over Union) measures overlap.

## Evaluation Metrics

**IoU:** overlap between predicted and ground truth boxes.

**mAP (mean Average Precision):** average precision across classes and IoU thresholds.

**COCO mAP:** averages over IoU 0.5 to 0.95, small/medium/large objects.

**FPS:** frames per second (speed).

Trade-off: accuracy vs speed.

## Semantic Segmentation

Classify every pixel.

**FCN (2014):** replace FC layers with conv layers. Output is a heatmap.

**U-Net (2015):** encoder-decoder with skip connections. Standard for medical imaging.

**DeepLab:** atrous convolutions for multi-scale context.

**SegFormer, Mask2Former:** transformer-based, state-of-the-art.

Loss: per-pixel cross-entropy, Dice, or focal.

## Instance Segmentation

Separate objects of the same class.

**Mask R-CNN (2017):** Faster R-CNN + mask branch. Standard.

**YOLACT:** real-time instance segmentation.

**SOLOv2, CondInst:** alternatives.

Used in robotics, autonomous driving.

## Panoptic Segmentation

Combine semantic (all pixels) + instance (individual objects).

Each pixel is labeled with a class AND an instance ID (for countable things).

Used in autonomous driving scene understanding.

## Keypoint Detection

Find specific points on objects (joints, facial landmarks).

**OpenPose:** bottom-up, detects all keypoints, groups into people.

**HRNet:** high-resolution network, accurate.

**MediaPipe:** Google's, real-time on mobile.

## 3D Vision

Beyond 2D images:
- **Depth estimation:** monocular or stereo
- **3D object detection:** LiDAR + camera
- **NeRF:** neural radiance fields for view synthesis
- **Gaussian Splatting:** fast 3D scene rendering
- **SLAM:** simultaneous localization and mapping

## Video Understanding

Beyond single images:
- **Action recognition:** classify actions in video
- **Temporal detection:** when does action happen
- **Video captioning:** describe video
- **Tracking:** follow objects across frames

Models: 3D CNNs, two-stream networks, transformers (TimeSformer, VideoMAE).

## Key Takeaways

- Detection: locate + classify objects
- Two-stage (Faster R-CNN) vs one-stage (YOLO)
- Anchors, NMS, IoU
- mAP is the standard metric
- Segmentation: semantic, instance, panoptic
- U-Net for medical, Mask R-CNN for general
- Keypoint detection: OpenPose, MediaPipe
- 3D vision: depth, NeRF, Gaussian Splatting
- Video: 3D CNNs, transformers
$LEC$, 50),

('deep-learning', 4, 'Generative Models: GANs, VAEs, Diffusion', $LEC$
## What are Generative Models?

Models that learn the distribution of data and generate new samples.

Tasks:
- Image generation (DALL-E, Stable Diffusion, Midjourney)
- Image editing (inpainting, style transfer)
- Super-resolution
- Data augmentation
- Anomaly detection

## Taxonomy

- **Explicit density:** model P(x) directly (VAE, autoregressive)
- **Implicit density:** learn to sample without P(x) (GAN)
- **Score-based / diffusion:** learn the gradient of log P(x)

Each has strengths.

## Autoencoders

Compress input to a latent code, reconstruct:

    x → Encoder → z → Decoder → x̂

Trained to minimize ||x - x̂||. Bottleneck forces compact representation.

Used for dimensionality reduction, denoising, feature learning.

But autoencoders are not generative — no way to sample new data.

## Variational Autoencoders (VAEs)

Encoder outputs a distribution (μ, σ), not a point. Sample z from it, decode.

Loss = reconstruction loss + KL divergence to prior.

    L = ||x - x̂||² + KL(q(z|x) || p(z))

Benefits:
- Smooth latent space
- Can sample new data
- Principled probabilistic framework

Downside: blurry samples (from MSE loss).

## GANs (Generative Adversarial Networks)

Goodfellow et al. (2014). Two networks:
- **Generator:** produces fake images from noise
- **Discriminator:** distinguishes real from fake

Trained adversarially:

    min_G max_D E[log D(x)] + E[log(1 - D(G(z)))]

Generator tries to fool discriminator; discriminator tries not to be fooled.

Result: generator produces realistic images.

## GAN Variants

- **DCGAN:** convolutional GAN, stable architecture
- **CycleGAN:** unpaired image translation (horse ↔ zebra)
- **StyleGAN:** high-quality faces, controllable style
- **Pix2Pix:** paired image translation (edges → photos)
- **BigGAN:** class-conditional, high fidelity
- **Progressive GAN:** grow resolution during training

## GAN Challenges

- **Mode collapse:** generator produces limited variety
- **Training instability:** hard to balance G and D
- **Evaluation:** hard to measure quality (FID, IS)

## Diffusion Models

Sohl-Dickstein et al. (2015), popularized by Ho et al. (2020).

Forward process: gradually add noise to image.

    x_t = √(1-β_t) x_{t-1} + √β_t ε

After T steps, x_T is pure noise.

Reverse process: learn to denoise step by step.

    x_{t-1} = (1/√α_t) (x_t - (1-α_t)/√(1-ᾱ_t) ε_θ(x_t, t))

Train network to predict noise ε at each step.

## Why Diffusion Works

- Stable training (simple MSE loss)
- High-quality samples
- Covers the data distribution (no mode collapse)
- Controllable generation

Downside: slow sampling (many steps). Solved by DDIM, DPM-Solver.

## Stable Diffusion

Latent diffusion: apply diffusion in a compressed latent space (VAE encoded).

Benefits: much faster, lower compute.

Text conditioning via CLIP text encoder → cross-attention.

Powers DALL-E 2, Stable Diffusion, Midjourney, Imagen.

## Classifier-Free Guidance

Improve sample quality by combining conditional and unconditional predictions:

    ε = ε_uncond + w (ε_cond - ε_uncond)

w is the guidance scale. Higher w → more fidelity to prompt, less diversity.

## ControlNet

Add spatial conditioning (pose, edges, depth) to diffusion models.

Enables precise control over generation.

## Evaluation Metrics

- **FID (Fréchet Inception Distance):** distance between real and generated distributions in feature space. Lower is better.
- **IS (Inception Score):** quality + diversity. Higher is better.
- **CLIP Score:** text-image alignment.

No metric is perfect; human eval still matters.

## Applications

- Text-to-image (DALL-E 3, SDXL, Midjourney)
- Text-to-video (Sora, Runway)
- Image editing (inpainting, outpainting)
- 3D generation (DreamFusion)
- Drug discovery (molecule generation)
- Audio generation (MusicGen, AudioLM)

## Key Takeaways

- Generative models learn P(x)
- Autoencoders compress; VAEs sample
- GANs: adversarial, sharp but unstable
- Diffusion: iterative denoising, high quality, stable
- Stable Diffusion: latent diffusion + text conditioning
- Guidance, ControlNet for control
- FID is standard metric
- Diffusions dominate image generation
$LEC$, 50),

('deep-learning', 5, 'Advanced Topics and Deployment', $LEC$
## Self-Supervised Learning

Learn representations without labels. Use pretext tasks:
- **Contrastive:** pull similar pairs together, push dissimilar apart
- **Masked prediction:** predict masked parts
- **Rotation:** predict how image was rotated

Methods: SimCLR, MoCo, BYOL, DINO, MAE.

Why it matters: unlabeled data is abundant; labels are expensive.

Foundation models (CLIP, DINOv2) trained self-supervised.

## Vision Transformers (ViT)

Apply transformer to images: split into patches, treat as tokens.

    Image (224×224) → 16×16 patches → 196 tokens → Transformer

Requires more data than CNNs. On ImageNet alone, ViT underperforms ResNet. On larger datasets (JFT-300M), it surpasses.

Modern: Swin, DeiT, BEiT, DINOv2.

## Multimodal Models

Combine vision + language:
- **CLIP:** contrastive image-text pretraining
- **BLIP:** captioning, VQA
- **Flamingo:** few-shot visual understanding
- **GPT-4V, Gemini:** native multimodal LLMs
- **LLaVA:** open-source vision-language

Enables image captioning, VQA, image-grounded dialogue.

## Neural Architecture Search (NAS)

Automate architecture design.

- **Reinforcement learning:** controller proposes architectures
- **Evolutionary:** mutate and select
- **Differentiable (DARTS):** relax discrete choices

Found architectures: NASNet, AmoebaNet, EfficientNet.

Expensive to run but produces efficient models.

## Model Compression

Deploy large models on small devices.

**Pruning:** remove weights/neurons. Sparse models run faster.

**Quantization:** reduce precision.
- Post-training: quantize trained model (INT8)
- Quantization-aware training: simulate quantization during training
- 4-bit, 2-bit for LLMs

**Knowledge distillation:** train small student to mimic large teacher.

**Low-rank factorization:** replace layers with smaller matrices.

Combined: 10-100x smaller models with minor quality loss.

## Efficient Architectures

- **MobileNet:** depthwise separable convolutions
- **ShuffleNet:** channel shuffle for efficiency
- **EfficientNet:** compound scaling
- **MobileViT:** hybrid CNN + transformer

Used in mobile, embedded, edge.

## Hardware for Deep Learning

- **GPUs:** NVIDIA dominates (A100, H100, RTX 4090)
- **TPUs:** Google's tensor processing units
- **NPUs:** dedicated neural network accelerators (Apple Neural Engine, Qualcomm Hexagon)
- **FPGAs:** reconfigurable, flexible
- **ASICs:** custom silicon (Google TPU, Tesla FSD)
- **Neuromorphic:** brain-inspired (Intel Loihi)

Each has trade-offs in speed, power, cost, flexibility.

## Frameworks

- **PyTorch:** research standard, dynamic graphs
- **TensorFlow:** production, Keras API
- **JAX:** functional, autograd, XLA
- **MXNet:** Amazon, legacy
- **ONNX:** interchange format
- **TVM:** compiler for deployment

PyTorch dominates research; TF/JAX in production.

## Deployment

From trained model to production:
1. Export to ONNX or TorchScript
2. Optimize (quantization, pruning)
3. Convert to target (TensorRT, CoreML, TFLite)
4. Serve (REST API, gRPC)
5. Monitor (latency, accuracy, drift)

Tools: TorchServe, Triton, KServe, BentoML.

## Ethics and Fairness

Models can be biased, unfair, or harmful.

Issues:
- **Bias:** racial, gender, age in predictions
- **Privacy:** models memorize training data
- **Deepfakes:** realistic fake media
- **Misuse:** surveillance, manipulation
- **Environmental:** energy cost of training

Mitigation:
- Bias testing and correction
- Differential privacy
- Watermarking generated content
- Regulation (EU AI Act)

## Interpretability

Understanding why models predict what they do.

- **Saliency maps:** which pixels matter
- **Grad-CAM:** class activation maps
- **Attention visualization:** what the model attends to
- **LIME, SHAP:** local explanations

Important for high-stakes applications (medical, legal, autonomous).

## Future Directions

- **Foundation models:** one model for many tasks
- **Multimodal:** text, image, audio, video
- **Efficient:** smaller, faster, cheaper
- **Robust:** handle distribution shift, adversarial attacks
- **Aligned:** safe, honest, helpful
- **Reasoning:** chain-of-thought, planning
- **Agents:** LLMs that take actions

The field moves fast. Stay curious.

## Key Takeaways

- Self-supervised learning uses unlabeled data
- ViT brings transformers to vision
- Multimodal models combine vision + language
- NAS automates architecture design
- Compression: pruning, quantization, distillation
- Efficient architectures for edge
- GPUs/TPUs/NPUs/FPGAs for training and inference
- PyTorch, TF, JAX frameworks
- Deployment: export, optimize, serve, monitor
- Ethics, interpretability, and safety are critical
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================
select 
  c.code,
  c.title,
  c.university,
  count(l.id) as lectures
from public.courses c
left join public.lectures l on l.course_slug = c.slug
group by c.id, c.code, c.title, c.university
order by lectures desc, c.code;