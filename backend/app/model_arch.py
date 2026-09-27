import torch
import torch.nn as nn


class ConvBlock(nn.Module):
    def __init__(self, in_ch, out_ch, kernel_size, stride=1, pool=2, dropout=0.2):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv1d(in_ch, out_ch, kernel_size, stride=stride, padding=kernel_size // 2),
            nn.BatchNorm1d(out_ch),
            nn.ReLU(inplace=True),
            nn.MaxPool1d(pool),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        return self.net(x)


class SleepCNN(nn.Module):
    def __init__(self, n_classes=5, in_channels=1, base_filters=32, dropout=0.3):
        super().__init__()
        self.features = nn.Sequential(
            ConvBlock(in_channels, base_filters, kernel_size=50, stride=6, pool=4, dropout=dropout),
            ConvBlock(base_filters, base_filters * 2, kernel_size=8, pool=2, dropout=dropout),
            ConvBlock(base_filters * 2, base_filters * 2, kernel_size=8, pool=2, dropout=dropout),
            ConvBlock(base_filters * 2, base_filters * 4, kernel_size=8, pool=4, dropout=dropout),
        )
        self.global_pool = nn.AdaptiveAvgPool1d(1)
        self.classifier = nn.Sequential(
            nn.Linear(base_filters * 4, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(128, n_classes),
        )

    def forward(self, x):
        feat = self.features(x)
        feat = self.global_pool(feat).squeeze(-1)
        return self.classifier(feat)

    def embed(self, x):
        feat = self.features(x)
        return self.global_pool(feat).squeeze(-1)


class SleepCNNLSTM(nn.Module):

    def __init__(self, n_classes=5, base_filters=32, lstm_hidden=128,
                 lstm_layers=2, dropout=0.3, bidirectional=True):
        super().__init__()
        self.cnn = SleepCNN(n_classes=n_classes, base_filters=base_filters, dropout=dropout)
        feat_dim = base_filters * 4
        self.lstm = nn.LSTM(
            input_size=feat_dim, hidden_size=lstm_hidden, num_layers=lstm_layers,
            batch_first=True, bidirectional=bidirectional,
            dropout=dropout if lstm_layers > 1 else 0.0,
        )
        out_dim = lstm_hidden * (2 if bidirectional else 1)
        self.classifier = nn.Sequential(
            nn.Linear(out_dim, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(128, n_classes),
        )

    def forward(self, x):
        # x: (batch, seq_len, 1, n_times)
        b, t, c, n = x.shape
        x = x.view(b * t, c, n)
        emb = self.cnn.embed(x).view(b, t, -1)
        seq_out, _ = self.lstm(emb)
        return self.classifier(seq_out)


MODEL_REGISTRY = {"cnn": SleepCNN, "cnn_lstm": SleepCNNLSTM}


def build_model(name: str, **kwargs) -> torch.nn.Module:
    if name not in MODEL_REGISTRY:
        raise ValueError(f"Unknown model '{name}'. Options: {list(MODEL_REGISTRY)}")
    return MODEL_REGISTRY[name](**kwargs)
